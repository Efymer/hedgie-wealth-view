// POST /api/auth/login
// Step 4: Server verifies the signature
// Verifies the wallet signature against the challenge and issues JWT

import type { IncomingHttpHeaders } from "http";
import { createHmac, createPublicKey, verify as cryptoVerify, createHash } from "crypto";
import { Redis } from "ioredis";

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
    console.log("=== Signature Verification Debug ===");
    console.log("Account ID:", accountId);
    console.log("Challenge:", challenge);
    console.log("Signature type:", typeof signature);
    console.log("Signature:", signature);
    
    // Let's also check what the frontend actually sent vs what we expect
    console.log("Frontend sent challenge length:", challenge.length);
    console.log("Challenge starts with:", challenge.substring(0, 50));
    console.log("Challenge ends with:", challenge.substring(challenge.length - 50));

    const keyInfo = await fetchAccountPrimaryKey(accountId);
    console.log("Key info:", keyInfo);
    console.log("Raw public key hex:", keyInfo?.pubKey?.toString('hex'));
    
    // Let's also check if we can get the public key from the signature object
    if (typeof signature === "object" && signature !== null && !Array.isArray(signature)) {
      const sigObj = signature as any;
      if (sigObj.publicKey) {
        console.log("Public key from signature object:", sigObj.publicKey);
      }
    }

    if (!keyInfo || keyInfo.algo !== "ED25519") {
      console.log("No ED25519 key found for account");
      return false;
    }

    // Handle signature as Buffer or base64 string
    let signatureBuffer: Buffer;
    if (Buffer.isBuffer(signature)) {
      signatureBuffer = signature;
      console.log("Using signature as Buffer, length:", signatureBuffer.length);
    } else {
      // Try different encodings
      try {
        signatureBuffer = Buffer.from(signature, "base64");
        console.log("Decoded as base64, length:", signatureBuffer.length);
      } catch (e1) {
        try {
          signatureBuffer = Buffer.from(signature, "hex");
          console.log("Decoded as hex, length:", signatureBuffer.length);
        } catch (e2) {
          console.log("Failed to decode signature as base64 or hex");
          return false;
        }
      }
    }

    // Try different ways to create the ED25519 public key
    console.log("Trying different public key formats...");
    
    // Method 1: SPKI format (current approach)
    const spki = ed25519SpkiFromRaw(keyInfo.pubKey);
    console.log("SPKI hex:", spki.toString('hex'));
    
    let publicKey;
    try {
      publicKey = createPublicKey({
        key: spki,
        format: "der",
        type: "spki",
      });
      console.log("✅ SPKI public key created successfully");
    } catch (e) {
      console.log("❌ SPKI public key creation failed:", e.message);
      
      // Method 2: Try raw key format
      try {
        publicKey = createPublicKey({
          key: keyInfo.pubKey,
          format: "der",
          type: "spki",
        });
        console.log("✅ Raw public key created successfully");
      } catch (e2) {
        console.log("❌ Raw public key creation failed:", e2.message);
        return false;
      }
    }

    const messageBuffer = Buffer.from(challenge, "utf8");
    console.log("Message buffer length:", messageBuffer.length);
    console.log("Signature buffer length:", signatureBuffer.length);
    console.log("Message hex:", messageBuffer.toString('hex'));
    console.log("Signature hex:", signatureBuffer.toString('hex'));
    
    // Test if our ED25519 verification setup is working at all
    try {
      const testMessage = Buffer.from("test", "utf8");
      const testResult = cryptoVerify(null, testMessage, publicKey, signatureBuffer);
      console.log("Test verification with 'test' message:", testResult);
    } catch (e) {
      console.log("Test verification error:", e.message);
    }

    // Let's also try to verify the signature with different public key formats
    console.log("Testing different public key approaches...");
    try {
      // Try raw 32-byte key directly
      const rawKey = keyInfo.pubKey;
      console.log("Raw key length:", rawKey.length);
      
      // Try creating public key from raw bytes in different ways
      const keyFormats = [
        { name: "Raw 32 bytes as Ed25519", key: createPublicKey({ key: rawKey, format: 'der', type: 'spki' }) },
      ];
      
      for (const keyFormat of keyFormats) {
        try {
          const testResult = cryptoVerify(null, Buffer.from(challenge, 'utf8'), keyFormat.key, signatureBuffer);
          console.log(`${keyFormat.name} verification:`, testResult);
          if (testResult) {
            console.log(`✅ SUCCESS with ${keyFormat.name}!`);
            return true;
          }
        } catch (e) {
          console.log(`${keyFormat.name} error:`, e.message);
        }
      }
    } catch (e) {
      console.log("Alternative key format error:", e.message);
    }

    // Since public keys match perfectly, HashPack must be signing a different message format
    // Let's try some variations based on common wallet patterns
    const textEncoder = new TextEncoder();
    const challengeBytes = textEncoder.encode(challenge);
    
    // The challenge parameter now contains the full signedPayload structure already!
    // So we should test the challenge directly since it's the signedPayload JSON
    // Also try different signature interpretations
    console.log("Testing different signature formats...");
    const sigFormats = [
      { name: "Original signature", sig: signatureBuffer },
      { name: "Signature reversed", sig: Buffer.from(signatureBuffer).reverse() },
      { name: "First 32 bytes only", sig: signatureBuffer.subarray(0, 32) },
      { name: "Last 32 bytes only", sig: signatureBuffer.subarray(32) },
    ];
    
    for (const sigFormat of sigFormats) {
      try {
        const testResult = cryptoVerify(null, Buffer.from(challenge, 'utf8'), publicKey, sigFormat.sig);
        console.log(`${sigFormat.name} verification:`, testResult);
        if (testResult) {
          console.log(`✅ SUCCESS with ${sigFormat.name}!`);
          return true;
        }
      } catch (e) {
        console.log(`${sigFormat.name} error:`, e.message);
      }
    }

    const formats = [
      { name: "Challenge as signedPayload - HASHCONNECT PATTERN", buffer: Buffer.from(textEncoder.encode(challenge)) },
      { name: "Challenge UTF-8", buffer: Buffer.from(challenge, "utf8") },
      { name: "TextEncoder().encode() - EXACT MATCH", buffer: Buffer.from(challengeBytes) },
      { name: "SHA256 hash of challenge", buffer: createHash('sha256').update(challenge, 'utf8').digest() },
      { name: "Challenge with newline", buffer: Buffer.from(challenge + '\n', "utf8") },
    ];
    
    console.log("Challenge is now the signedPayload structure:", challenge);
    
    // Also let's check if the signature might be in a different format
    console.log("Signature analysis:");
    console.log("- First 8 bytes:", signatureBuffer.subarray(0, 8).toString('hex'));
    console.log("- Last 8 bytes:", signatureBuffer.subarray(-8).toString('hex'));
    console.log("- All zeros?", signatureBuffer.every(b => b === 0));
    console.log("- All 255s?", signatureBuffer.every(b => b === 255));

    for (const format of formats) {
      try {
        const isValid = cryptoVerify(null, format.buffer, publicKey, signatureBuffer);
        console.log(`${format.name} verification:`, isValid);
        if (isValid) {
          console.log(`✅ SUCCESS with ${format.name}`);
          console.log("=== End Debug ===");
          return true;
        }
      } catch (e) {
        console.log(`${format.name} error:`, e.message);
      }
    }
    
    console.log("❌ All verification attempts failed");
    console.log("=== End Debug ===");
    
    return false;
  } catch (e) {
    console.error("Signature verification error:", e);
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
