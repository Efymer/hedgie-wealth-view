// Mock whale detection utility
// In a real implementation, this would query blockchain data or whale tracking APIs

interface WhaleData {
  tokenId: string;
  isWhale: boolean;
  rank?: number; // Position in top holders (1 = biggest holder)
  percentage?: number; // Percentage of total supply held
}

// Mock data for whale detection
const MOCK_WHALE_DATA: Record<string, WhaleData> = {
  "HBAR": {
    tokenId: "HBAR",
    isWhale: false,
  },
  "0.0.456858": {
    tokenId: "0.0.456858", 
    isWhale: true,
    rank: 12,
    percentage: 2.4,
  },
  "0.0.731861": {
    tokenId: "0.0.731861",
    isWhale: true,
    rank: 3,
    percentage: 8.7,
  },
  "0.0.456860": {
    tokenId: "0.0.456860",
    isWhale: false,
  },
};

export function isAccountWhaleForToken(tokenId: string): WhaleData {
  return MOCK_WHALE_DATA[tokenId] || { tokenId, isWhale: false };
}

export function getWhaleTokens(tokenIds: string[]): WhaleData[] {
  return tokenIds.map(id => isAccountWhaleForToken(id)).filter(data => data.isWhale);
}