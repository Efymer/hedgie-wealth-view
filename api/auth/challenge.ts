// POST /api/auth/challenge
// Step 2: Server generates a challenge
// Creates a random nonce (challenge string) and sends it to the client

import type { IncomingHttpHeaders } from "http";
import { randomBytes } from "crypto";

export type Req = { method?: string; headers?: IncomingHttpHeaders; body?: unknown };
export type Res = { status: (c: number) => Res; json: (b: unknown) => void };

// In-memory nonce storage (in production, use Redis with TTL)
const activeNonces = new Map<string, { timestamp: number; accountId?: string }>();

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiry = 5 * 60 * 1000; // 5 minutes
  for (const [nonce, data] of activeNonces.entries()) {
    if (now - data.timestamp > expiry) {
      activeNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

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

    // Store nonce with timestamp for replay protection
    activeNonces.set(nonce, { timestamp: Date.now(), accountId });

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

// Export for use in login endpoint
export { activeNonces };
