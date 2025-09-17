import React from "react";
import { Users, ExternalLink, UserMinus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFollowedAccounts } from "@/hooks/useFollowedAccounts";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const FollowedAccountsDropdown: React.FC = () => {
  const { followedAccounts, unfollowAccount } = useFollowedAccounts();
  const navigate = useNavigate();

  const handleViewAccount = (accountId: string) => {
    navigate(`/explorer/${accountId}`);
  };

  const handleUnfollow = (accountId: string, accountName?: string) => {
    unfollowAccount(accountId);
    toast({
      title: "Unfollowed Account", 
      description: `You are no longer following ${accountName || accountId}`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-muted/80"
        >
          <Users className="h-5 w-5" />
          {followedAccounts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {followedAccounts.length > 9 ? '9+' : followedAccounts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Followed Accounts</h3>
          <p className="text-sm text-muted-foreground">
            {followedAccounts.length} account{followedAccounts.length !== 1 ? 's' : ''} followed
          </p>
        </div>

        <ScrollArea className="h-96">
          {followedAccounts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No accounts followed yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Follow accounts to track their activity
              </p>
            </div>
          ) : (
            <div className="p-2">
              {followedAccounts.map((account, index) => (
                <div key={account.accountId}>
                  <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.accountName || account.accountId}
                        </p>
                        {account.accountName && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {account.accountId}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Followed {new Date(account.followedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAccount(account.accountId)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnfollow(account.accountId, account.accountName)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {index < followedAccounts.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};