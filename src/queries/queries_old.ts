import { QueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "../helpers/store";
import { Buffer } from "buffer";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

const getHBARBalance = (walletId) =>
  axios
    .get(
      `https://mainnet.mirrornode.hedera.com/api/v1/balances?account.id=${walletId}`
    )
    .then((res) => res.data.balances[0])
    .catch(() => []);

export const useHBARBalance = (walletId: string) => {
  return useQuery({
    queryKey: [walletId, "hbar"],
    queryFn: () => getHBARBalance(walletId),
    enabled: !!walletId,
  });
};

const getWalletBalance = (walletId) =>
  axios
    .get(
      `https://mainnet.mirrornode.hedera.com/api/v1/accounts/${walletId}/tokens?limit=100`
    )
    .then((res) => res.data.tokens)
    .catch(() => []);

export const useWalletBalance = (walletId: string) => {
  return useQuery({
    queryKey: [walletId, "alltokens"],
    queryFn: () => getWalletBalance(walletId),
    enabled: !!walletId,
    select: (data) => ({
      ...data,
      tokensWithBalance: data.filter((token) => token.balance > 0),
      tokensWithoutBalance: data.filter((token) => token.balance < 1),
    }),
  });
};


const getTokenInfo = (tokenIds: string[]) =>
  axios
    .get(
      `https://hashpack-mirror.b-cdn.net/getTokenInfo?network=mainnet&token_ids=${tokenIds.join(
        ","
      )}`
    )
    .then((res) => res.data)
    .catch(() => []);

export const useTokenInfo = (walletId: string, tokenIds: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedTokenIds = tokenIds?.map((token: any) => token.token_id);

  return useQuery({
    queryKey: [walletId, "tokens"],
    queryFn: () => getTokenInfo(mappedTokenIds),
    enabled: !!walletId && !!tokenIds?.length && !!mappedTokenIds?.length,
    select: (data) => ({
      all: { ...data },
      tokens: data.filter((tokens) => tokens.type !== "NON_FUNGIBLE_UNIQUE"),
      nfts: data.filter((tokens) => tokens.type === "NON_FUNGIBLE_UNIQUE"),
    }),
  });
};

const getTokenPrices = () =>
  axios
    .post(`https://api-lb.hashpack.app/prices`)
    .then((res) => res.data)
    .catch(() => []);

export const useTokenPrices = (accountId: string) => {
  return useQuery({
    queryKey: ["prices"],
    queryFn: getTokenPrices,
    enabled: !!accountId,
  });
};

const getAccountNFTs = (walletId) =>
  axios
    .get(
      `https://mainnet.mirrornode.hedera.com/api/v1/accounts/${walletId}/nfts?limit=100`
    )
    .then((res) => res.data)
    .catch(() => []);

export const useAccountNFTs = (walletId: string) => {
  return useQuery({
    queryKey: [walletId, "nfts"],
    queryFn: () => getAccountNFTs(walletId),
    enabled: !!walletId,
  });
};

const getNFTMetadata = (CIDVALUE) =>
  axios
    .get(`https://hashpack.b-cdn.net/ipfs/${CIDVALUE}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((res: any) => res)
    .catch(() => []);

export const useNFTMetadata = (metadata: string) => {
  const walletId = useAppStore((store) => store.accountId);
  const base64 = metadata ? Buffer.from(metadata, "base64") : null;
  const CIDVALUE = base64?.toLocaleString().split("ipfs://")[1];

  return useQuery({
    queryKey: [walletId, "nfts", CIDVALUE],
    queryFn: () => getNFTMetadata(CIDVALUE),
    enabled: !!CIDVALUE,
  });
};

// TODO IMPLEMENT PAGINATION
const getWalletTransactions = (
  _walletId,
  nextPage = "api/v1/transactions?account.id=&limit=100"
) =>
  axios
    .get(`https://mainnet.mirrornode.hedera.com/${nextPage}`)
    .then((res) => res.data)
    .catch(() => []);

export const useWalletTransactions = (walletId: string) => {
  return useQuery({
    queryKey: [walletId, "transactions"],
    queryFn: () => getWalletTransactions(walletId),
    enabled: !!walletId,
  });
};
