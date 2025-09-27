import React, { useMemo, useState } from "react";
import { Bell, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotificationsQuery,
  useNotificationLastSeenQuery,
  useTokenInfoForIds,
} from "@/queries";
import { useMarkNotificationSeenMutation } from "@/mutations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { formatTokenBalance } from "@/lib/format";
import { useAccountId } from "@buidlerlabs/hashgraph-react-wallets";

export const NotificationsCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  // Poll latest notifications
  const { data: notifData } = useNotificationsQuery();
  const notifications = useMemo(
    () => notifData?.notifications ?? [],
    [notifData]
  );

  // Get unique token IDs from notifications for fetching decimals
  const notificationTokenIds = useMemo(() => {
    const tokenIds = notifications
      .map((n) => n.payload.token_id ?? "HBAR")
      .filter((token): token is string => Boolean(token));
    return Array.from(new Set(tokenIds));
  }, [notifications]);

  console.log("notificationTokenIds", notificationTokenIds);

  // Fetch token info specifically for tokens that appear in notifications
  const { data: notificationTokenInfo } =
    useTokenInfoForIds(notificationTokenIds);
  console.log("notificationTokenInfo", notificationTokenInfo);

  const tokenInfoArray = useMemo(() => {
    const tokens: Array<{ token_id: string; name: string; decimals: number }> =
      [];

    // Add HBAR info
    tokens.push({ token_id: "HBAR", name: "HBAR", decimals: 8 });

    // Add notification tokens info (already simplified from the hook)
    Object.values(notificationTokenInfo ?? {}).forEach((tokenInfo) => {
      if (tokenInfo?.token_id && typeof tokenInfo.decimals === "number") {
        tokens.push(tokenInfo);
      }
    });

    console.log("tokenInfoArray", tokens);
    return tokens;
  }, [notificationTokenInfo]);

  // Last seen pointer via GraphQL + React Query helper
  const { data: lastSeenData, refetch: refetchLastSeen } =
    useNotificationLastSeenQuery();

  const latestTs = notifications[0]?.consensus_ts;
  const lastSeenTs =
    lastSeenData?.notification_last_seen?.[0]?.last_seen_consensus_ts || null;

  const unreadCount = useMemo(() => {
    if (!lastSeenTs) return notifications.length;
    return notifications.filter((n) => n.consensus_ts > lastSeenTs).length;
  }, [notifications, lastSeenTs]);

  const markSeenMut = useMarkNotificationSeenMutation();

  const markAllAsRead = async () => {
    if (!latestTs) return;
    await markSeenMut.mutateAsync({ ts: latestTs });
    await refetchLastSeen();
  };

  const markOneAsRead = async (ts: string) => {
    await markSeenMut.mutateAsync({ ts });
    await refetchLastSeen();
  };

  // Enhanced authentication check using the new useAuth hook
  if (!auth.isAuthenticated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <Bell className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Connect wallet to view notifications</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-accent/10 hover:text-accent-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Activity from accounts you follow
          </p>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Follow accounts to get notified of their transactions
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((n, index) => {
                const isUnread = !lastSeenTs || n.consensus_ts > lastSeenTs;
                return (
                  <div key={n.id}>
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        isUnread ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markOneAsRead(n.consensus_ts)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">
                              {n.account_id}
                            </p>
                            {n.direction === "sent" ? (
                              <ArrowUpRight className="h-3 w-3 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm mt-1">
                            {n.direction === "sent" ? "Sent" : "Received"}{" "}
                            <span className="font-medium">
                              {(() => {
                                const tokenId = n.payload.token_id ?? "HBAR";
                                const amount = n.amount ?? 0;
                                const tokenInfo = tokenInfoArray.find(
                                  (t) => t.token_id === tokenId
                                );
                                const decimals = tokenInfo?.decimals ?? 0;
                                const tokenName = tokenInfo?.name ?? tokenId;
                                console.log(
                                  tokenId,
                                  amount,
                                  decimals,
                                  tokenName
                                );
                                return `${formatTokenBalance(
                                  amount,
                                  decimals
                                )} ${tokenName}`;
                              })()}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {n.consensus_ts}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                    {index < notifications.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
