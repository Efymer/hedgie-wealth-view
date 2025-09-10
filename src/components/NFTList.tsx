import React, { useMemo } from "react";
import { Image, ExternalLink, Hash } from "lucide-react";

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

export const NFTList: React.FC<NFTListProps> = ({
  nfts,
  isLoading = false,
}) => {
  const displayNFTs = useMemo(() => {
    return nfts.filter(nft => nft.balance > 0);
  }, [nfts]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">NFT Collection</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="shimmer glass-card rounded-lg p-4 h-40"
            ></div>
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