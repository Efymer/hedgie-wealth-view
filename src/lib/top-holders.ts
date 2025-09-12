// Mock top holders data
// In a real implementation, this would query blockchain data or holder tracking APIs

export interface TopHolder {
  rank: number;
  accountId: string;
  balance: number;
  percentageOfSupply: number;
  isCurrentAccount?: boolean;
}

// Mock data for top holders - different for each token
const MOCK_TOP_HOLDERS: Record<string, TopHolder[]> = {
  "HBAR": Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    accountId: `0.0.${Math.floor(Math.random() * 9000000) + 1000000}`,
    balance: Math.floor(Math.random() * 1000000000) + 1000000,
    percentageOfSupply: Math.random() * 10 + 0.1,
    isCurrentAccount: i === 67 && Math.random() > 0.5, // Sometimes the current account is in top 100
  })),
  
  "0.0.456858": Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    accountId: i === 11 ? "0.0.756953" : `0.0.${Math.floor(Math.random() * 9000000) + 1000000}`,
    balance: Math.floor(Math.random() * 50000000) + 100000,
    percentageOfSupply: i === 0 ? 15.2 : Math.random() * 8 + 0.05,
    isCurrentAccount: i === 11,
  })),
  
  "0.0.731861": Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    accountId: i === 2 ? "0.0.756953" : `0.0.${Math.floor(Math.random() * 9000000) + 1000000}`,
    balance: Math.floor(Math.random() * 100000000) + 500000,
    percentageOfSupply: i === 0 ? 22.1 : i === 1 ? 18.7 : i === 2 ? 8.7 : Math.random() * 5 + 0.02,
    isCurrentAccount: i === 2,
  })),
};

// Generate mock data for any token not in the predefined list
function generateMockHolders(tokenId: string): TopHolder[] {
  const seed = tokenId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    accountId: `0.0.${Math.floor(random(seed + i) * 9000000) + 1000000}`,
    balance: Math.floor(random(seed + i + 100) * 10000000) + 50000,
    percentageOfSupply: i === 0 ? random(seed) * 20 + 5 : random(seed + i + 200) * 3 + 0.01,
    isCurrentAccount: false,
  }));
}

export function getTopHolders(tokenId: string): TopHolder[] {
  return MOCK_TOP_HOLDERS[tokenId] || generateMockHolders(tokenId);
}

export function getCurrentAccountRank(tokenId: string, currentAccountId: string): number | null {
  const holders = getTopHolders(tokenId);
  const currentHolder = holders.find(h => h.accountId === currentAccountId);
  return currentHolder?.rank || null;
}