// POST /api/auth/challenge
// Step 2: Server generates a challenge
// Creates a random nonce (challenge string) and sends it to the client

import type { IncomingHttpHeaders } from "http";
import { randomBytes, createHmac } from "crypto";
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

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method Not Allowed" });

    const body = (req.body || {}) as Partial<{ accountId: string }>;
    const { accountId } = body;

    if (typeof accountId !== "string") {
      return res.status(400).json({ error: "accountId required" });
    }

    // Generate server-signed payload following HashPack pattern
    const timestamp = Date.now();
    const nonce = randomBytes(16).toString("hex");

    // Create payload similar to HashPack docs
    const payload = {
      url: process.env.FRONTEND_URL || "http://localhost:3000",
      data: {
        ts: timestamp,
        accountId: accountId,
        nonce: nonce,
      },
    };

    // Server signs the payload (this proves the challenge came from our server)
    const serverSecret =
      process.env.SERVER_SIGNING_SECRET || process.env.HASURA_ADMIN_SECRET;
    if (!serverSecret) throw new Error("SERVER_SIGNING_SECRET required");

    const payloadString = JSON.stringify(payload);
    const serverSignature = createHmac("sha256", serverSecret)
      .update(payloadString)
      .digest("hex");

    // Store nonce in Redis with 5-minute TTL for replay protection
    const redisClient = getRedisClient();
    const nonceKey = `auth:nonce:${nonce}`;
    const nonceData = JSON.stringify({
      timestamp,
      accountId,
      payload,
      serverSignature,
    });
    await redisClient.setex(nonceKey, 5 * 60, nonceData); // 5 minutes TTL

    return res.status(200).json({
      payload,
      serverSignature,
      nonce,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
