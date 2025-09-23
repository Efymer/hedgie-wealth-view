// POST /api/auth/challenge
// Step 1: Server generates a nonce/challenge for client to sign

import type { IncomingHttpHeaders } from "http";
import { randomBytes, randomUUID } from "crypto";
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

// Helper functions
function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function buildChallengeMessage(params: {
  domain: string;
  uri: string;
  accountId: string;
  nonce: string;
  issuedAt: string;
}): string {
  return `${params.domain} wants you to sign in with your Hedera account:
${params.accountId}

URI: ${params.uri}
Nonce: ${params.nonce}
Issued At: ${params.issuedAt}`;
}

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method Not Allowed" });

    const body = (req.body || {}) as Partial<{ 
      accountId: string; 
      publicKey: string; 
      domain?: string; 
      uri?: string; 
    }>;
    
    const { accountId, publicKey, domain, uri } = body;

    if (!accountId || !publicKey) {
      return res.status(400).json({ error: "accountId and publicKey are required" });
    }

    // Generate nonce and build challenge message
    const nonce = randomUUID(); // cryptographically random
    const issuedAt = new Date().toISOString();
    const message = buildChallengeMessage({
      domain: domain || 'hedgie-wealth-view.vercel.app',
      uri: uri || process.env.FRONTEND_URL || 'https://hedgie-wealth-view.vercel.app/login',
      accountId,
      nonce,
      issuedAt,
    });

    const msgBytes = utf8ToBytes(message);
    const nonceId = randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store nonce data in Redis
    const redisClient = getRedisClient();
    const nonceKey = `auth:nonce:${nonceId}`;
    const nonceData = {
      accountId,
      publicKey,
      msgBytes,
      expiresAt,
      used: false
    };
    
    await redisClient.setex(nonceKey, 5 * 60, JSON.stringify(nonceData)); // 5 minutes TTL

    return res.status(200).json({
      nonceId,
      message, // human-readable (display to user)
      messageBase64: Buffer.from(msgBytes).toString('base64'), // wallets often want bytes
      expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Challenge error:", message);
    return res.status(500).json({ error: message });
  }
}
