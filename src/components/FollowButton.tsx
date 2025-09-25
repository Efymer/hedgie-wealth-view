import React from "react";
import { UserPlus, UserMinus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowedAccounts } from "@/hooks/useFollowedAccounts";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

  const handleClick = () => {
    if (!auth.isAuthenticated) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to enable notifications",
      });
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

  return (
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
          <span>Connect Wallet for Notifications</span>
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
  );
};
