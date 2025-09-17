import React from "react";
import { UserPlus, UserMinus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowedAccounts } from "@/hooks/useFollowedAccounts";
import { toast } from "@/hooks/use-toast";

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
  const following = isFollowing(accountId);

  const handleClick = () => {
    toggleFollow(accountId, accountName);
    
    if (following) {
      toast({
        title: "Notifications Disabled",
        description: `You will no longer receive transaction notifications from ${accountName || accountId}`,
      });
    } else {
      toast({
        title: "Notifications Enabled",
        description: `You will now receive notifications when ${accountName || accountId} makes transactions`,
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={following ? "default" : variant}
      size={size}
      className={`flex items-center space-x-2 ${
        following 
          ? "bg-green-600 hover:bg-green-700 text-white" 
          : "hover:bg-muted/80"
      }`}
    >
      {following ? (
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