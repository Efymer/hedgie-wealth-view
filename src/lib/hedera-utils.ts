import { formatDistanceToNow } from "date-fns";

/**
 * Converts a Hedera consensus timestamp to a JavaScript Date object
 * @param consensusTs - Consensus timestamp in format "1695777782.123456789"
 * @returns JavaScript Date object
 */
export const parseConsensusTimestamp = (consensusTs: string): Date => {
  const [seconds, nanos = "0"] = consensusTs.split(".");
  const milliseconds = parseInt(seconds) * 1000 + Math.floor(parseInt(nanos.padEnd(9, "0")) / 1000000);
  return new Date(milliseconds);
};

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 * @param date - Date object to format
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Converts tinybars to HBAR
 * @param tinybars - Amount in tinybars
 * @returns Amount in HBAR
 */
export const tinybarToHBAR = (tinybars: number | undefined | null): number => {
  if (!tinybars) return 0;
  return tinybars / 100_000_000;
};

/**
 * Extracts IPFS CID from base64-encoded NFT metadata
 * @param metadataBase64 - Base64 encoded metadata string
 * @returns IPFS CID or null if not found
 */
export const extractCIDFromBase64Metadata = (
  metadataBase64?: string | null
): string | null => {
  if (!metadataBase64) return null;
  try {
    // Browser base64 decode (Vite app runs in browser)
    if (typeof atob !== "function") return null;
    const jsonStr = atob(metadataBase64);
    // Attempt to parse JSON first; if it fails, fall back to raw string search
    try {
      const obj = JSON.parse(jsonStr);
      const val: unknown =
        (obj as Record<string, unknown>)?.["uri"] ??
        (obj as Record<string, unknown>)?.["metadata"] ??
        (obj as Record<string, unknown>)?.["ipfs"] ??
        (obj as Record<string, unknown>)?.["image"];
      if (typeof val === "string") {
        const m = val.match(/ipfs:\/\/([^\s"']+)/i);
        if (m?.[1]) return m[1];
      }
      // If JSON has no uri/image, still try raw string
    } catch (_) {
      // Not JSON, continue to raw extraction
    }
    const rawMatch = jsonStr.match(/ipfs:\/\/([^\s"']+)/i);
    if (rawMatch?.[1]) return rawMatch[1];
  } catch {
    // ignore
  }
  return null;
};
