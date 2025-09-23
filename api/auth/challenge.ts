// POST /api/auth/challenge
// Step 2: Server generates a challenge
// Creates a random nonce (challenge string) and sends it to the client

import type { IncomingHttpHeaders } from "http";
import { randomBytes } from "crypto";
import { Redis } from "ioredis";

export type Req = { method?: string; headers?: IncomingHttpHeaders; body?: unknown };
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

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const body = (req.body || {}) as Partial<{ accountId: string }>;
    const { accountId } = body;

    if (typeof accountId !== "string") {
      return res.status(400).json({ error: "accountId required" });
    }

    // Generate random nonce
    const nonceBytes = randomBytes(16);
    const nonce = nonceBytes.toString("hex");
    
    // Create human-readable challenge message
    const timestamp = new Date().toISOString();
    const challenge = `Login request #${nonce} for account ${accountId} at ${timestamp}`;

    // Store nonce in Redis with 5-minute TTL for replay protection
    const redisClient = getRedisClient();
    const nonceKey = `auth:nonce:${nonce}`;
    const nonceData = JSON.stringify({ timestamp: Date.now(), accountId });
    await redisClient.setex(nonceKey, 5 * 60, nonceData); // 5 minutes TTL

    return res.status(200).json({ 
      challenge,
      nonce,
      timestamp 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

