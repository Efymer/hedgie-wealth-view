import React, { useMemo, useState } from "react";
import { Image, ExternalLink, Hash, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useAccountNFTs,
  useNFTMetadata,
  type AccountNFT,
} from "@/queries";
import { extractCIDFromBase64Metadata } from "@/lib/hedera-utils";
import { useOnScreen } from "@/hooks/use-on-screen";
import { NFTDetailsModal } from "./NFTDetailsModal";

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

// Type for NFT modal data
interface NFTModalData {
  id: string;
  name: string;
  symbol?: string;
  serialNumber?: string;
  image?: string;
  description?: string;
  tokenId?: string;
  isForSale?: boolean;
  price?: string;
  lastSalePrice?: string;
  owner?: string;
  creator?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

// Mock data for SentX marketplace status
const getMockSaleStatus = (tokenId: string) => {
  const hash = tokenId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  // const isForSale = hash % 3 === 0; // ~33% chance of being for sale
  const isForSale = false;
  const price = isForSale ? (50 + (hash % 500)).toString() : undefined;
  return { isForSale, price };
};

const NFTCard: React.FC<{ nft: NFT; onOpenModal: (nft: NFTModalData) => void }> = ({ nft, onOpenModal }) => {
  const mockStatus = getMockSaleStatus(nft.id);
  const handleClick = () => {
    onOpenModal({
      id: nft.id,
      name: nft.name,
      symbol: nft.symbol,
      tokenId: nft.id,
      description: `This is a mock description for ${nft.name}. This NFT represents a unique digital asset on the Hedera network.`,
      isForSale: mockStatus.isForSale,
      price: mockStatus.price,
      lastSalePrice: "125",
      attributes: [
        { trait_type: "Rarity", value: "Common" },
        { trait_type: "Category", value: "Digital Art" },
      ],
    });
  };

  return (
    <div 
      className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer relative"
      onClick={handleClick}
    >
      {mockStatus.isForSale && (
        <Badge variant="default" className="absolute top-2 right-2 z-10">
          <DollarSign className="h-3 w-3 mr-1" />
          Sale
        </Badge>
      )}
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
        {mockStatus.isForSale && (
          <p className="text-xs text-green-500 font-medium">{mockStatus.price} HBAR</p>
        )}
      </div>
    </div>
  );
};

// NFT item that resolves metadata->image for an account NFT row
const AccountNFTItem: React.FC<{ item: AccountNFT; onOpenModal: (nft: NFTModalData) => void }> = ({ item, onOpenModal }) => {
  const { ref, isIntersecting } = useOnScreen<HTMLDivElement>({ rootMargin: "200px 0px" });
  const metaQuery = useNFTMetadata(item.metadata as string | undefined, isIntersecting);

  // Determine display media (image or video) URL from metadata JSON if available
  const media = useMemo(() => {
    const m = metaQuery.data as unknown as {
      image?: string;
      image_url?: string;
      animation_url?: string;
      mime_type?: string;
      format?: string;
    } | null;

    const toHttp = (u: string) => {
      const match = u.match(/ipfs:\/\/([\s\S]+)/i);
      if (match?.[1]) return `https://hashpack.b-cdn.net/ipfs/${match[1]}`;
      return u;
    };

    // Prefer animation_url (often videos) over image fields
    const candidates = [
      m && typeof m.animation_url === "string" ? m.animation_url : undefined,
      m && typeof m.image === "string" ? m.image : undefined,
      m && typeof m.image_url === "string" ? m.image_url : undefined,
    ].filter(Boolean) as string[];

    let url = candidates.length > 0 ? toHttp(candidates[0]) : undefined;

    if (!url) {
      // Some NFTs encode direct CID in the base64 metadata
      const cid = extractCIDFromBase64Metadata(item.metadata as string | undefined);
      url = cid ? `https://hashpack.b-cdn.net/ipfs/${cid}` : undefined;
    }

    const lowerUrl = (url || "").toLowerCase();
    const mime = (m && (typeof m.mime_type === "string" ? m.mime_type : typeof m.format === "string" ? m.format : "")) || "";
    const looksLikeVideo = mime.startsWith("video/") || /(\.mp4|\.webm|\.ogg|\.mov|\.m4v)(?:$|\?)/i.test(lowerUrl);

    return { url, kind: looksLikeVideo ? ("video" as const) : ("image" as const) };
  }, [metaQuery.data, item.metadata]);

  const mockStatus = getMockSaleStatus(item.token_id);
  
  // Extract name from metadata, fallback to token ID
  const nftName = useMemo(() => {
    const metadata = metaQuery.data as unknown as { 
      name?: string; 
      title?: string;
    } | null;
    return metadata?.name || metadata?.title || `NFT ${item.token_id}`;
  }, [metaQuery.data, item.token_id]);
  
  const handleClick = () => {
    const metadata = metaQuery.data as unknown as { 
      name?: string; 
      title?: string;
      description?: string; 
      attributes?: Array<{ trait_type: string; value: string }> 
    } | null;

    onOpenModal({
      id: item.token_id,
      name: nftName,
      tokenId: item.token_id,
      serialNumber: item.serial_number.toString(),
      image: media.url,
      description: metadata?.description || `${nftName} NFT from token ${item.token_id}.`,
      isForSale: mockStatus.isForSale,
      price: mockStatus.price,
      lastSalePrice: "89",
      attributes: metadata?.attributes || [
        { trait_type: "Token ID", value: item.token_id },
        { trait_type: "Serial", value: item.serial_number.toString() },
      ],
    });
  };

  return (
    <div 
      ref={ref} 
      className="glass-card rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer relative"
      onClick={handleClick}
    >
      {mockStatus.isForSale && (
        <Badge variant="default" className="absolute top-2 right-2 z-10">
          <DollarSign className="h-3 w-3 mr-1" />
          Sale
        </Badge>
      )}
      <div className="aspect-square bg-muted/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {isIntersecting && media.url ? (
          media.kind === "video" ? (
            <video
              src={media.url}
              controls
              preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={media.url}
              alt={`${item.token_id} #${item.serial_number}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <Image className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{nftName}</h3>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-muted-foreground truncate">Serial #{item.serial_number}</p>
        {mockStatus.isForSale && (
          <p className="text-xs text-green-500 font-medium">{mockStatus.price} HBAR</p>
        )}
      </div>
    </div>
  );
};

export const NFTList: React.FC<NFTListProps> = ({
  nfts,
  isLoading = false,
  accountId,
}) => {
  const [selectedNFT, setSelectedNFT] = useState<NFTModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accountNFTsQuery = useAccountNFTs(accountId || "");

  const handleOpenModal = (nft: NFTModalData) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

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
            <AccountNFTItem 
              key={`${it.token_id}:${it.serial_number}`}
              item={it}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
        
        <NFTDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          nft={selectedNFT || { id: '', name: '' }}
        />
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
          <NFTCard key={nft.id} nft={nft} onOpenModal={handleOpenModal} />
        ))}
      </div>

      <NFTDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        nft={selectedNFT || { id: '', name: '' }}
      />
    </div>
  );
};