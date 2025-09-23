// POST /api/auth/login
// Step 4: Server verifies the signature
// Verifies the wallet signature against the challenge and issues JWT

import type { IncomingHttpHeaders } from "http";
import { createHmac, createHash } from "crypto";
import { Redis } from "ioredis";
import { PublicKey } from "@hashgraph/sdk";

export type Req = {
  method?: string;
  headers?: IncomingHttpHeaders;
  body?: unknown;
};
export type Res = { status: (c: number) => Res; json: (b: unknown) => void };

// Redis client for nonce storage
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is required");
    }
    redis = new Redis(redisUrl);
  }
  return redis;
}

// GraphQL helper
async function gql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
) {
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

// JWT creation
function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function createHasuraJWT(userId: string) {
  const secret = process.env.JWT_SIGNING_SECRET as string;
  const issuer = process.env.JWT_ISSUER || "hedgie-auth";
  if (!secret) throw new Error("Missing JWT_SIGNING_SECRET");

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: issuer,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
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

// Hedera account key fetching and verification
const MIRROR =
  process.env.MIRROR_NODE_URL || "https://mainnet.mirrornode.hedera.com";

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex.replace(/^0x/, ""), "hex");
}

function ed25519SpkiFromRaw(raw32: Buffer): Buffer {
  // SPKI DER for Ed25519 = SEQUENCE( AlgorithmIdentifier(1.3.101.112), BIT STRING(pubkey) )
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, raw32]);
}

async function fetchAccountPrimaryKey(
  accountId: string
): Promise<{ algo: "ED25519"; pubKey: Buffer } | null> {
  const url = `${MIRROR}/api/v1/accounts/${encodeURIComponent(accountId)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const data = await res.json();
  const keyObj = data?.key || data?.keys || data?.account?.key;
  if (!keyObj) return null;

  // Handle ED25519 key object
  if (
    typeof keyObj === "object" &&
    typeof keyObj.key === "string" &&
    (keyObj._type === "ED25519" || keyObj.type === "ED25519")
  ) {
    const raw = hexToBuffer(keyObj.key);
    if (raw.length !== 32) return null;
    return { algo: "ED25519", pubKey: raw };
  }

  // Handle direct hex string (64 chars = 32 bytes)
  if (typeof keyObj === "string" && /^[0-9a-fA-F]{64}$/.test(keyObj)) {
    const raw = hexToBuffer(keyObj);
    return { algo: "ED25519", pubKey: raw };
  }

  return null;
}

async function verifyWalletSignature(
  accountId: string,
  challenge: string,
  signature: Buffer | string,
  serverSignature?: string
): Promise<boolean> {
  if (process.env.ALLOW_DEV_AUTH === "true") return true;

  try {
    console.log("=== Hedera SDK Signature Verification ===");
    console.log("Account ID:", accountId);
    console.log("Challenge:", challenge);
    console.log("Signature type:", typeof signature);
    console.log("Signature:", signature);
    
    const keyInfo = await fetchAccountPrimaryKey(accountId);
    console.log("Key info:", keyInfo);
    
    if (!keyInfo || keyInfo.algo !== "ED25519") {
      console.log("No ED25519 key found for account");
      return false;
    }

    // Handle signature as Buffer first
    let signatureBuffer: Buffer;
    if (Buffer.isBuffer(signature)) {
      signatureBuffer = signature;
      console.log("Using signature as Buffer, length:", signatureBuffer.length);
    } else {
      // Convert from serialized format
      if (typeof signature === "object" && signature !== null && (signature as any).type === "Buffer" && Array.isArray((signature as any).data)) {
        signatureBuffer = Buffer.from((signature as any).data);
        console.log("Converted from Buffer serialization, length:", signatureBuffer.length);
      } else if (Array.isArray(signature)) {
        signatureBuffer = Buffer.from(signature);
        console.log("Converted from array, length:", signatureBuffer.length);
      } else {
        signatureBuffer = Buffer.from(signature as string, "base64");
        console.log("Converted from base64 string, length:", signatureBuffer.length);
      }
    }

    console.log("Signature hex:", signatureBuffer.toString('hex'));

    // Create Hedera PublicKey from raw bytes
    console.log("Raw public key bytes:", keyInfo.pubKey);
    console.log("Raw public key hex:", keyInfo.pubKey.toString('hex'));
    console.log("Raw public key length:", keyInfo.pubKey.length);
    
    const hederaPublicKey = PublicKey.fromBytes(keyInfo.pubKey);
    console.log("Hedera public key created:", hederaPublicKey.toString());

    // Verify using Hedera SDK - pass signature bytes directly
    const messageBytes = Buffer.from(challenge, "utf8");
    console.log("Message to verify:", challenge);
    console.log("Message bytes length:", messageBytes.length);
    
    const isValid = hederaPublicKey.verify(messageBytes, signatureBuffer);
    
    // Also try alternative message formats if primary verification fails
    if (!isValid) {
      console.log("Primary verification failed, trying alternative message formats...");
      
      const messageFormats = [
        { name: "TextEncoder bytes", bytes: new TextEncoder().encode(challenge) },
        { name: "UTF-8 with BOM", bytes: Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(challenge, 'utf8')]) },
        { name: "Just payload part", bytes: Buffer.from(JSON.stringify(JSON.parse(challenge).payload), 'utf8') },
        { name: "Challenge without spaces", bytes: Buffer.from(challenge.replace(/\s/g, ''), 'utf8') },
        { name: "Challenge as hex then utf8", bytes: Buffer.from(Buffer.from(challenge, 'utf8').toString('hex'), 'utf8') },
      ];
      
      for (const format of messageFormats) {
        try {
          const formatIsValid = hederaPublicKey.verify(Buffer.from(format.bytes), signatureBuffer);
          console.log(`${format.name} verification:`, formatIsValid);
          if (formatIsValid) {
            console.log(`✅ SUCCESS with ${format.name}!`);
            return true;
          }
        } catch (e) {
          console.log(`${format.name} error:`, e.message);
        }
      }
      
      // Also try alternative public key creation
      try {
        const altPublicKey = PublicKey.fromString(keyInfo.pubKey.toString('hex'));
        console.log("Alternative public key from hex:", altPublicKey.toString());
        
        const altIsValid = altPublicKey.verify(messageBytes, signatureBuffer);
        console.log("Alternative key verification result:", altIsValid);
        if (altIsValid) {
          console.log("✅ SUCCESS with alternative public key!");
          return true;
        }
      } catch (e) {
        console.log("Alternative public key creation failed:", e.message);
      }
    }
    
    console.log("✅ Hedera SDK verification result:", isValid);
    console.log("=== End Hedera SDK Debug ===");
    
    return isValid;

  } catch (e) {
    console.error("Hedera SDK verification error:", e);
    return false;
  }
}

// User management
async function upsertUserByWallet(accountId: string): Promise<string> {
  const mutation = /* GraphQL */ `
    mutation UpsertUser($wallet: String!) {
      insert_users_one(
        object: { wallet_account_id: $wallet }
        on_conflict: {
          constraint: users_wallet_account_id_key
          update_columns: []
        }
      ) {
        id
      }
    }
  `;
  const data = await gql<{ insert_users_one: { id: string } }>(mutation, {
    wallet: accountId,
  });
  return data.insert_users_one.id;
}

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method Not Allowed" });

    const body = (req.body || {}) as Partial<{
      accountId: string;
      signature: string | { type: "Buffer"; data: number[] };
      nonce: string;
      challenge: { payload: { url: string; data: { ts: number; accountId: string; nonce: string } }; server: { accountId: string; signature: string } };
    }>;

    const { accountId, signature, nonce, challenge } = body;

    if (
      typeof accountId !== "string" ||
      !signature ||
      typeof nonce !== "string" ||
      !challenge
    ) {
      return res
        .status(400)
        .json({ error: "accountId, signature, nonce, and challenge required" });
    }

    // Step 4a: Verify nonce exists and hasn't been reused
    const redisClient = getRedisClient();
    const nonceKey = `auth:nonce:${nonce}`;
    const nonceDataStr = await redisClient.get(nonceKey);

    if (!nonceDataStr) {
      return res.status(400).json({ error: "Invalid or expired nonce" });
    }

    const nonceData = JSON.parse(nonceDataStr) as {
      timestamp: number;
      accountId: string;
      payload: { url: string; data: { ts: number; accountId: string; nonce: string } };
      serverSignature: string;
    };

    // Check nonce is for the correct account
    if (nonceData.accountId !== accountId) {
      return res
        .status(400)
        .json({ error: "Nonce was issued for different account" });
    }

    // Check nonce age (5 minutes max) - Redis TTL should handle this, but double-check
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - nonceData.timestamp > maxAge) {
      await redisClient.del(nonceKey);
      return res.status(400).json({ error: "Nonce expired" });
    }

    // Verify server signature first
    const serverSecret = process.env.SERVER_SIGNING_SECRET || process.env.HASURA_ADMIN_SECRET;
    if (!serverSecret) {
      return res.status(500).json({ error: "Server signing secret not configured" });
    }
    
    const expectedServerSig = createHmac('sha256', serverSecret).update(JSON.stringify(challenge.payload)).digest('hex');
    if (expectedServerSig !== challenge.server.signature) {
      return res.status(400).json({ error: "Invalid server signature" });
    }

    // Consume nonce (prevent replay)
    await redisClient.del(nonceKey);

    // Step 4b: Verify the wallet signature
    // Handle signature as Buffer, Uint8Array, or string
    let signatureToVerify: Buffer | string;
    console.log("Raw signature received:", signature);
    console.log("Signature type:", typeof signature);
    console.log("Is array?", Array.isArray(signature));
    
    if (
      typeof signature === "object" &&
      signature.type === "Buffer" &&
      Array.isArray(signature.data)
    ) {
      // Signature came as Buffer serialized to JSON: { type: 'Buffer', data: [1,2,3...] }
      signatureToVerify = Buffer.from(signature.data);
      console.log("Converted Buffer signature, length:", signatureToVerify.length);
    } else if (Array.isArray(signature)) {
      // Signature came as Uint8Array serialized to JSON: [182, 226, 93, 38, ...]
      signatureToVerify = Buffer.from(signature);
      console.log("Converted Uint8Array signature, length:", signatureToVerify.length);
    } else if (typeof signature === "object" && signature !== null) {
      // Check if it's a Uint8Array-like object
      const sigObj = signature as any;
      if (sigObj.type === "Uint8Array" && Array.isArray(sigObj.data)) {
        signatureToVerify = Buffer.from(sigObj.data);
        console.log("Converted Uint8Array object signature, length:", signatureToVerify.length);
      } else {
        console.log("Unknown signature object format:", sigObj);
        signatureToVerify = signature as string;
      }
    } else {
      // Signature is a string (base64 or hex)
      signatureToVerify = signature as string;
      console.log("Using signature as string");
    }

    // The wallet signs the challenge structure (Buidler Labs dAccess pattern)
    const challengeToVerify = JSON.stringify(challenge);
    console.log("Backend challenge to verify:", challengeToVerify);
    console.log("Original payload from nonce:", JSON.stringify(nonceData.payload));
    console.log("Payloads match:", JSON.stringify(challenge.payload) === JSON.stringify(nonceData.payload));
    
    const isValidSignature = await verifyWalletSignature(
      accountId,
      challengeToVerify,
      signatureToVerify,
      challenge.server.signature
    );
    if (!isValidSignature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Step 5: Issue JWT
    const userId = await upsertUserByWallet(accountId);
    const token = createHasuraJWT(userId);

    return res.status(200).json({
      token,
      userId,
      accountId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", message);
    return res.status(500).json({ error: message });
  }
}
