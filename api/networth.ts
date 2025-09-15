// Returns net worth timeseries suitable for NetWorthChart.tsx
// GET /api/networth?accountId=0.0.x&limit=90

import Redis from "ioredis";

type Req = { method?: string; query?: Record<string, unknown> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const redis = new Redis(process.env.REDIS_URL as string);

type NetWorthPoint = { date: string; value: number; change: number };

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method && req.method !== "GET")
      return res.status(405).json({ error: "Method Not Allowed" });
    const accountId = String(req.query?.accountId || "").trim();
    if (!accountId)
      return res.status(400).json({ error: "accountId is required" });

    const limit = Math.max(
      1,
      Math.min(365, parseInt(String(req.query?.limit || "90"), 10) || 90)
    );
    const key = `networth:${accountId}`;

    // Fetch latest N points
    // ZREVRANGE withscores is nice, but we stored score as timestamp and member JSON with date+value.
    const raw = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");

    // raw = [member, score, member, score, ...]
    const points: Array<{ date: string; value: number; score: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      const member = raw[i];
      const score = Number(raw[i + 1]);
      try {
        const parsed = JSON.parse(member) as { date: string; value: number };
        points.push({ date: parsed.date, value: parsed.value, score });
      } catch {
        // skip
      }
    }

    // Ensure chronological order (oldest -> newest) by score (timestamp)
    points.sort((a, b) => a.score - b.score);

    // Compute percentage change vs previous
    const data: NetWorthPoint[] = points.map((p, idx) => {
      if (idx === 0) return { date: p.date, value: p.value, change: 0 };
      const prev = points[idx - 1];
      const change = prev.value
        ? ((p.value - prev.value) / prev.value) * 100
        : 0;
      return { date: p.date, value: p.value, change };
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: message });
  }
}
