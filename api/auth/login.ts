// POST /api/auth/login
// Step 2: Server verifies the signature
// Verifies the wallet signature against the challenge and issues JWT

import type { IncomingHttpHeaders } from "http";
import { createHmac, createHash, randomBytes } from "crypto";
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

// Helper functions for cleaner auth flow
function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
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
  const secret = process.env.HASURA_ADMIN_SECRET as string;
  const issuer = process.env.JWT_ISSUER || "hedgie-auth";
  if (!secret) throw new Error("Missing HASURA_ADMIN_SECRET");

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
async function verifySignature(
  publicKeyString: string,
  messageBytesBase64: string,
  signatureBase64: string
): Promise<boolean> {
  // Enable dev auth in development mode
  if (
    process.env.ALLOW_DEV_AUTH === "true" ||
    process.env.NODE_ENV === "development"
  ) {
    console.log("🚧 DEV AUTH: Bypassing signature verification");
    return true;
  }

  try {
    console.log("Verifying signature with:");
    console.log("- Public Key:", publicKeyString);
    console.log("- Message Bytes (base64):", messageBytesBase64);
    console.log("- Signature (base64):", signatureBase64);
    
    // Create Hedera PublicKey from string (handles DER & raw hex forms)
    const pk = PublicKey.fromString(publicKeyString);
    const sigBytes = base64ToBytes(signatureBase64);
    const msgBytes = base64ToBytes(messageBytesBase64);
    
    console.log("- Message bytes length:", msgBytes.length);
    console.log("- Signature bytes length:", sigBytes.length);
    
    // Verify Ed25519 signature
    const isValid = pk.verify(msgBytes, sigBytes);
    console.log("Signature verification result:", isValid);

    return isValid;
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

// User management
async function upsertUserByWallet(accountId: string): Promise<string | null> {
  console.log("upsertUserByWallet called with accountId:", accountId);

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

  console.log("Hasura endpoint:", process.env.HASURA_GRAPHQL_ENDPOINT);
  console.log("Has admin secret:", !!process.env.HASURA_ADMIN_SECRET);

  try {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { wallet: accountId },
      }),
    });

    console.log("Hasura response status:", response.status);

    if (!response.ok) {
      console.error(
        "Hasura response not ok:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Hasura error response:", errorText);
      return null;
    }

    const result = await response.json();
    console.log("Hasura response:", JSON.stringify(result, null, 2));

    if (result.errors) {
      console.error("Hasura GraphQL errors:", result.errors);
      return null;
    }

    const userId = result.data?.insert_users_one?.id;
    console.log("Extracted user ID:", userId);

    return userId;
  } catch (error) {
    console.error("upsertUserByWallet error:", error);
    return null;
  }
}

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method Not Allowed" });

    const body = (req.body || {}) as Partial<{
      nonceId: string;
      accountId: string;
      publicKey: string;
      signatureBase64: string;
    }>;

    const { nonceId, accountId, publicKey, signatureBase64 } = body;

    if (!nonceId || !accountId || !publicKey || !signatureBase64) {
      return res.status(400).json({
        error: "nonceId, accountId, publicKey, signatureBase64 required",
      });
    }

    // Get nonce data from Redis
    const redisClient = getRedisClient();
    const nonceKey = `auth:nonce:${nonceId}`;
    const nonceDataStr = await redisClient.get(nonceKey);

    if (!nonceDataStr) {
      return res.status(400).json({ error: "Unknown or expired nonce" });
    }

    const nonceData = JSON.parse(nonceDataStr) as {
      accountId: string;
      publicKey: string;
      message: string;
      msgBytes: string;
      expiresAt: number;
      used: boolean;
    };

    // Validate nonce
    if (nonceData.used) {
      return res.status(400).json({ error: "Nonce already used" });
    }
    if (Date.now() > nonceData.expiresAt) {
      await redisClient.del(nonceKey);
      return res.status(400).json({ error: "Nonce expired" });
    }
    if (nonceData.accountId !== accountId) {
      return res.status(400).json({ error: "Account mismatch" });
    }
    if (nonceData.publicKey !== publicKey) {
      return res.status(400).json({ error: "Public key mismatch" });
    }

    // Verify signature
    const isValid = await verifySignature(
      publicKey,
      nonceData.msgBytes,
      signatureBase64
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Mark nonce as used (prevent replay)
    nonceData.used = true;
    await redisClient.setex(nonceKey, 60, JSON.stringify(nonceData)); // Keep for 1 minute

    // Create user and issue JWT
    const userId = await upsertUserByWallet(accountId);
    if (!userId) {
      return res.status(500).json({ error: "Failed to create or find user" });
    }

    const token = createHasuraJWT(userId);

    return res.status(200).json({
      ok: true,
      token,
      accountId,
      userId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", message);
    return res.status(500).json({ error: message });
  }
}
