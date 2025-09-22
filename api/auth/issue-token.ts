// Issues a Hasura-compatible JWT after verifying a wallet signature
// POST /api/auth/issue-token { accountId: string, nonce: string, signature: string }
// Env:
// - HASURA_GRAPHQL_ENDPOINT
// - HASURA_ADMIN_SECRET
// - JWT_SIGNING_SECRET (HS256)
// - JWT_ISSUER (optional, default: "hedgie-auth")
// - ALLOW_DEV_AUTH (optional: "true" to bypass signature verification in dev)

import type { IncomingHttpHeaders } from "http";

// Node crypto-based HS256 JWT (no external deps)
import { createHmac, randomBytes, createPublicKey, verify as cryptoVerify } from "crypto";

// Basic fetch wrapper
async function gql<T = unknown>(query: string, variables: Record<string, unknown> = {}) {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT as string;
  const admin = process.env.HASURA_ADMIN_SECRET as string;
  if (!endpoint || !admin) throw new Error("Missing HASURA env");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": admin,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message || `GraphQL error (${res.status})`;
    throw new Error(msg);
  }
  return json.data as T;
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(data: string, secret: string) {
  const sig = createHmac("sha256", secret).update(data).digest();
  return base64url(sig);
}

function createHasuraJWT(userId: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  const secret = process.env.JWT_SIGNING_SECRET as string;
  if (!secret) throw new Error("Missing JWT_SIGNING_SECRET");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const issuer = process.env.JWT_ISSUER || "hedgie-auth";
  const payload = {
    iat: now,
    exp: now + expiresInSeconds,
    iss: issuer,
    sub: userId,
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["user"],
      "x-hasura-default-role": "user",
      "x-hasura-user-id": userId,
    },
  };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = signHS256(`${h}.${p}`, secret);
  return `${h}.${p}.${sig}`;
}

// Verify a wallet signature against Hedera account public key (ED25519 support)
// Expected signed message format (must match frontend):
//   `hedgie-auth:${nonce}` (utf8)
// Signature is expected in base64.
const MIRROR = process.env.MIRROR_NODE_URL || "https://mainnet.mirrornode.hedera.com";

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex.replace(/^0x/, ""), "hex");
}

function ed25519SpkiFromRaw(raw32: Buffer): Buffer {
  // SPKI DER for Ed25519 = SEQUENCE( AlgorithmIdentifier(1.3.101.112), BIT STRING(pubkey) )
  // Prefix: 302a300506032b6570032100 || 32-byte raw key
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, raw32]);
}

async function fetchAccountPrimaryKey(accountId: string): Promise<{ algo: "ED25519"; pubKey: Buffer } | null> {
  const url = `${MIRROR}/api/v1/accounts/${encodeURIComponent(accountId)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  // Mirror Node may return key in different shapes
  // Prefer simple key
  const keyObj = data?.key || data?.keys || data?.account?.key;
  if (!keyObj) return null;

  // If single ED25519 key
  if (typeof keyObj === "object" && typeof keyObj.key === "string" && (keyObj._type === "ED25519" || keyObj.type === "ED25519")) {
    const raw = hexToBuffer(keyObj.key);
    if (raw.length !== 32) return null;
    return { algo: "ED25519", pubKey: raw };
  }
  // Some mirror responses expose the hex directly
  if (typeof keyObj === "string" && /^[0-9a-fA-F]{64}$/.test(keyObj)) {
    const raw = hexToBuffer(keyObj);
    return { algo: "ED25519", pubKey: raw };
  }
  // Unhandled key types (e.g., ECDSA/secp256k1, keylists, threshold keys)
  return null;
}

async function verifyWalletSignature(accountId: string, nonce: string, signatureB64: string) {
  if (process.env.ALLOW_DEV_AUTH === "true") return true;
  try {
    const info = await fetchAccountPrimaryKey(accountId);
    if (!info || info.algo !== "ED25519") return false;
    const message = `hedgie-auth:${nonce}`;
    const sig = Buffer.from(signatureB64, "base64");
    const spki = ed25519SpkiFromRaw(info.pubKey);
    const pubKey = createPublicKey({ key: spki, format: "der", type: "spki" });
    // For Ed25519, Node uses null algorithm parameter
    const ok = cryptoVerify(null, Buffer.from(message, "utf8"), pubKey, sig);
    return ok;
  } catch (e) {
    return false;
  }
}

// Upsert user by wallet account id and return user UUID
async function upsertUserByWallet(accountId: string): Promise<string> {
  const mutation = /* GraphQL */ `
    mutation UpsertUser($wallet: String!) {
      insert_users_one(
        object: { wallet_account_id: $wallet }
        on_conflict: { constraint: users_wallet_account_id_key, update_columns: [] }
      ) { id }
    }
  `;
  const data = await gql<{ insert_users_one: { id: string } }>(mutation, { wallet: accountId });
  return data.insert_users_one.id;
}

export type Req = { method?: string; headers?: IncomingHttpHeaders; body?: unknown };
export type Res = { status: (c: number) => Res; json: (b: unknown) => void };

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    const body = (req.body || {}) as Partial<{ accountId: string; nonce: string; signature: string }>;
    const { accountId, nonce, signature } = body;
    if (typeof accountId !== "string" || typeof nonce !== "string" || typeof signature !== "string") {
      return res.status(400).json({ error: "accountId, nonce, signature required" });
    }

    const ok = await verifyWalletSignature(accountId, nonce, signature);
    if (!ok) return res.status(501).json({ error: "Signature verification not implemented" });

    const userId = await upsertUserByWallet(accountId);
    const token = createHasuraJWT(userId);

    return res.status(200).json({ token, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
