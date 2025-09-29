import React, { useState } from "react";
import { UserPlus, UserMinus, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowedAccounts } from "@/hooks/useFollowedAccounts";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";

interface FollowButtonProps {
  accountId: string;
  accountName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  accountId,
  accountName,
  variant = "outline",
  size = "default",
}) => {
  const { isFollowing, toggleFollow } = useFollowedAccounts();
  const auth = useAuth();
  const following = isFollowing(accountId);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { connect: connectHashpack } = useWallet(HashpackConnector);

  const handleClick = () => {
    if (!auth.isAuthenticated) {
      setShowConnectModal(true);
      return;
    }

    toggleFollow(accountId, accountName);

    if (following) {
      toast({
        title: "Notifications Disabled",
        description: `You will no longer receive transaction notifications from ${
          accountName || accountId
        }`,
      });
    } else {
      toast({
        title: "Notifications Enabled",
        description: `You will now receive notifications when ${
          accountName || accountId
        } makes transactions`,
      });
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectHashpack();
      setShowConnectModal(false);
      toast({
        title: "Wallet Connected",
        description: "Please sign the authentication challenge",
      });
    } catch (e) {
      toast({
        title: "Connection Failed",
        description: e instanceof Error ? e.message : "Failed to connect wallet",
      });
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={following ? "default" : variant}
        size={size}
        className={`flex items-center space-x-2 transition-colors ${
          following
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : !auth.isAuthenticated
            ? "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border-input"
            : "hover:bg-accent hover:text-accent-foreground border-input"
        }`}
      >
        {!auth.isAuthenticated ? (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Follow</span>
          </>
        ) : following ? (
          <>
            <Check className="h-4 w-4" />
            <span>Notifications On</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Get Notifications</span>
          </>
        )}
      </Button>

      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet to Follow</DialogTitle>
            <DialogDescription>
              You need to connect your wallet to follow accounts and receive notifications about their transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 pt-4">
            <Button
              onClick={handleConnectWallet}
              className="flex items-center space-x-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Hashpack Wallet</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConnectModal(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
