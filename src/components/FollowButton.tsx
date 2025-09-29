import React, { useState } from "react";
import { UserPlus, UserMinus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowedAccounts } from "@/hooks/useFollowedAccounts";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { WalletConnectModal } from "@/components/WalletConnectModal";

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
  const { connectAndAuthenticate, isLoading } = useWalletAuth({
    autoAuthenticate: true,
    onSuccess: () => {
      setShowConnectModal(false);
      // After successful authentication, trigger the follow action
      setTimeout(() => {
        toggleFollow(accountId, accountName);
        toast({
          title: "Notifications Enabled",
          description: `You will now receive notifications when ${
            accountName || accountId
          } makes transactions`,
        });
      }, 100);
    },
  });

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
      await connectAndAuthenticate();
      // Success handling is done in the onSuccess callback
    } catch (e) {
      // Error handling is done in the useWalletAuth hook
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={following ? "default" : variant}
        size={size}
        className={`flex items-center space-x-2 transition-colors border ${
          following
            ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
            : !auth.isAuthenticated
            ? "bg-accent/10 text-foreground border-accent hover:bg-accent hover:text-accent-foreground"
            : "bg-accent/10 text-foreground border-accent hover:bg-accent hover:text-accent-foreground"
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

      <WalletConnectModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onConnect={handleConnectWallet}
        isLoading={isLoading}
        title="Connect Wallet to Follow"
        description="You need to connect your wallet to follow accounts and receive notifications about their transactions."
      />
    </>
  );
};
