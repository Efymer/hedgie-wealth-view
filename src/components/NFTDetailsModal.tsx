import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, ExternalLink, Tag, Hash, Calendar, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NFTDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
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
  };
}

export const NFTDetailsModal: React.FC<NFTDetailsModalProps> = ({
  isOpen,
  onClose,
  nft,
}) => {
  const handleViewOnSentX = () => {
    window.open(`https://sentx.io/nft/${nft.tokenId}/${nft.serialNumber}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {nft.name}
            {nft.isForSale && (
              <Badge variant="default" className="ml-2">
                <DollarSign className="h-3 w-3 mr-1" />
                For Sale
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Image */}
          <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden">
            {nft.image ? (
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Token ID</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">{nft.tokenId}</p>
            </div>
            
            {nft.serialNumber && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Serial Number</span>
                </div>
                <p className="text-sm text-muted-foreground">#{nft.serialNumber}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {nft.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">{nft.description}</p>
            </div>
          )}

          <Separator />

          {/* Pricing Info */}
          {(nft.isForSale || nft.lastSalePrice) && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Market Info</h3>
              <div className="grid grid-cols-2 gap-4">
                {nft.isForSale && nft.price && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Current Price</span>
                    </div>
                    <p className="text-sm text-green-500 font-medium">{nft.price} HBAR</p>
                  </div>
                )}
                
                {nft.lastSalePrice && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Last Sale</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{nft.lastSalePrice} HBAR</p>
                  </div>
                )}
              </div>
              <Separator />
            </div>
          )}

          {/* Attributes */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Attributes</h3>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {attr.trait_type}
                    </p>
                    <p className="text-sm font-medium">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleViewOnSentX} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on SentX
            </Button>
            {nft.isForSale && (
              <Button variant="outline" onClick={handleViewOnSentX}>
                <DollarSign className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};