import React, { useMemo } from "react";
import { Image, ExternalLink, Hash } from "lucide-react";
import {
  useAccountNFTs,
  useNFTMetadata,
  extractCIDFromBase64Metadata,
  type AccountNFT,
} from "@/queries";
import { useOnScreen } from "@/hooks/use-on-screen";

interface NFT {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  type?: string;
}

interface NFTListProps {
  nfts: NFT[];
  isLoading?: boolean;
  accountId?: string; // when provided, component will fetch NFTs and ignore nfts prop
}

const NFTCard: React.FC<{ nft: NFT }> = ({ nft }) => {
  return (
    <div className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group">
      <div className="aspect-square bg-muted/20 rounded-lg mb-3 flex items-center justify-center">
        <Image className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{nft.symbol}</h3>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{nft.name}</p>
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {nft.balance} {nft.balance === 1 ? "NFT" : "NFTs"}
          </span>
        </div>
      </div>
    </div>
  );
};

// NFT item that resolves metadata->image for an account NFT row
const AccountNFTItem: React.FC<{ item: AccountNFT }> = ({ item }) => {
  const { ref, isIntersecting } = useOnScreen<HTMLDivElement>({ rootMargin: "200px 0px" });
  const metaQuery = useNFTMetadata(item.metadata as string | undefined, isIntersecting);

  // Determine display image URL from metadata JSON if available
  const imageUrl = useMemo(() => {
    const m = metaQuery.data as unknown as { image?: string; image_url?: string } | null;
    const cand = (m && typeof m.image === "string" ? m.image : undefined) ?? (m && typeof m.image_url === "string" ? m.image_url : undefined);
    if (typeof cand === "string") {
      const match = cand.match(/ipfs:\/\/([\s\S]+)/i);
      if (match?.[1]) {
        return `https://hashpack.b-cdn.net/ipfs/${match[1]}`;
      }
      return cand; // already http(s)
    }
    // Some NFTs encode direct CID in the base64 metadata
    const cid = extractCIDFromBase64Metadata(item.metadata as string | undefined);
    return cid ? `https://hashpack.b-cdn.net/ipfs/${cid}` : undefined;
  }, [metaQuery.data, item.metadata]);

  return (
    <div ref={ref} className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group">
      <div className="aspect-square bg-muted/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {isIntersecting && imageUrl ? (
          <img src={imageUrl} alt={`${item.token_id} #${item.serial_number}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <Image className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{item.token_id}</h3>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-muted-foreground truncate">Serial #{item.serial_number}</p>
      </div>
    </div>
  );
};

export const NFTList: React.FC<NFTListProps> = ({
  nfts,
  isLoading = false,
  accountId,
}) => {
  // If accountId is provided, fetch account NFTs directly
  const accountNFTsQuery = useAccountNFTs(accountId || "");

  const displayNFTs = useMemo(() => {
    return nfts.filter((nft) => nft.balance > 0);
  }, [nfts]);

  if (isLoading || accountNFTsQuery.isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">NFT Collection</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer glass-card rounded-lg p-4 h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  // When using account NFTs mode
  if (accountId) {
    const items = (accountNFTsQuery.data ?? []) as AccountNFT[];
    if (!items.length) {
      return (
        <div className="glass-card rounded-xl p-6 w-full">
          <div className="flex items-center gap-2 mb-6">
            <Image className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">NFT Collection</h2>
          </div>
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No NFTs found for this account</p>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">NFT Collection</h2>
          <span className="ml-auto text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <AccountNFTItem key={`${it.token_id}:${it.serial_number}`} item={it} />
          ))}
        </div>
      </div>
    );
  }

  if (displayNFTs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">NFT Collection</h2>
        </div>
        <div className="text-center py-8">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No NFTs found for this account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 w-full">
      <div className="flex items-center gap-2 mb-6">
        <Image className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">NFT Collection</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          {displayNFTs.length} {displayNFTs.length === 1 ? "collection" : "collections"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayNFTs.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};