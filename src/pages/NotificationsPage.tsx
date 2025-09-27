import React, { useState, useMemo } from "react";
import {
  Bell,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import {
  useNotificationsQuery,
  useNotificationLastSeenQuery,
  useTokenInfoForIds,
  type GqlNotification,
} from "@/queries/index";
import { useMarkNotificationSeenMutation } from "@/mutations/index";
import {
  parseConsensusTimestamp,
  formatRelativeTime,
} from "@/lib/hedera-utils";
import { useAuth } from "@/hooks/useAuth";
import { formatAmount } from "@/lib/format";

interface NotificationData {
  id: string;
  accountId: string;
  accountName?: string;
  type: "sent" | "received";
  amount: number;
  token: string;
  timestamp: string;
  date: Date;
  isRead: boolean;
}

const NotificationsPage: React.FC = () => {
  const auth = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">(
    "all"
  );
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">(
    "all"
  );

  // Fetch notifications and last seen data
  const { data: notifData, isLoading: notificationsLoading } =
    useNotificationsQuery();
  const { data: lastSeenData } = useNotificationLastSeenQuery();
  const markSeenMutation = useMarkNotificationSeenMutation();

  const rawNotifications = useMemo(
    () => notifData?.notifications ?? [],
    [notifData]
  );
  const lastSeenTs =
    lastSeenData?.notification_last_seen?.[0]?.last_seen_consensus_ts || null;

  // Get unique token IDs from notifications for fetching decimals
  const notificationTokenIds = useMemo(() => {
    const tokenIds = rawNotifications
      .map((n) => {
        // For HBAR, there's no token_id in payload, so we skip it
        if (n.token === "HBAR" || !n.payload?.token_id) return null;
        return n.payload.token_id;
      })
      .filter((tokenId): tokenId is string => Boolean(tokenId));
    return Array.from(new Set(tokenIds));
  }, [rawNotifications]);

  // Fetch token info for notification tokens to get decimals
  const { data: notificationTokenInfo } =
    useTokenInfoForIds(notificationTokenIds);

  // Build decimals map for token_id -> decimals
  const tokenDecimalsMap = useMemo(() => {
    const map = new Map<string, number>();
    // Add HBAR decimals (always 8)
    map.set("HBAR", 8);
    // Add other token decimals from notification token info
    (notificationTokenInfo ?? []).forEach((tokenInfo) => {
      if (tokenInfo.token_id && typeof tokenInfo.decimals === "number") {
        map.set(tokenInfo.token_id, tokenInfo.decimals);
      }
    });
    return map;
  }, [notificationTokenInfo]);

  // Transform GraphQL notifications to component format
  const notifications: NotificationData[] = useMemo(() => {
    return rawNotifications.map((n: GqlNotification) => {
      const date = parseConsensusTimestamp(n.consensus_ts);
      const isRead = lastSeenTs ? n.consensus_ts <= lastSeenTs : false;

      return {
        id: n.id,
        accountId: n.account_id,
        accountName: n.account_id, // Could be enhanced with account names from follows
        type: n.direction,
        amount: n.amount || 0,
        token: n.token || "HBAR",
        timestamp: formatRelativeTime(date),
        date,
        isRead,
      };
    });
  }, [rawNotifications, lastSeenTs]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        (notification.accountName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ??
          false) ||
        notification.accountId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        notification.token.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" || notification.type === filterType;
      const matchesRead =
        filterRead === "all" ||
        (filterRead === "read" && notification.isRead) ||
        (filterRead === "unread" && !notification.isRead);

      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, searchQuery, filterType, filterRead]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationData[] } = {};

    filteredNotifications.forEach((notification) => {
      const date = startOfDay(notification.date);
      const key = date.toISOString();

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedGroups;
  }, [filteredNotifications]);

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const markAsRead = async (consensusTs: string) => {
    try {
      await markSeenMutation.mutateAsync({ ts: consensusTs });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!rawNotifications.length) return;

    try {
      // Find the latest consensus timestamp from raw notifications
      const latestConsensusTs = rawNotifications[0]?.consensus_ts;
      if (latestConsensusTs) {
        await markSeenMutation.mutateAsync({ ts: latestConsensusTs });
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Show loading state
  if (notificationsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show connect wallet message
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground">
                Connect your wallet to view notifications from accounts you
                follow
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">
                  Activity from accounts you follow
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark all as read ({unreadCount})
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={filterType}
                onValueChange={(value: "all" | "sent" | "received") =>
                  setFilterType(value)
                }
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterRead}
                onValueChange={(value: "all" | "read" | "unread") =>
                  setFilterRead(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                No notifications found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all" || filterRead !== "all"
                  ? "Try adjusting your search or filters"
                  : "Follow accounts to get notified of their transactions"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedNotifications.map(([dateKey, dayNotifications]) => (
              <div key={dateKey}>
                <div className="flex items-center space-x-4 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {formatDateHeader(dateKey)}
                  </h2>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="space-y-3">
                  {dayNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`transition-all hover:shadow-md cursor-pointer ${
                        !notification.isRead
                          ? "ring-2 ring-primary/20 bg-primary/5"
                          : ""
                      }`}
                      onClick={() => {
                        const rawNotif = rawNotifications.find(
                          (n) => n.id === notification.id
                        );
                        if (rawNotif && !notification.isRead) {
                          markAsRead(rawNotif.consensus_ts);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="font-semibold truncate">
                                {notification.accountName ||
                                  notification.accountId}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {notification.accountId}
                              </Badge>
                              {notification.type === "sent" ? (
                                <div className="flex items-center space-x-1 text-red-500">
                                  <ArrowUpRight className="h-4 w-4" />
                                  <span className="text-sm">Sent</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-green-500">
                                  <ArrowDownLeft className="h-4 w-4" />
                                  <span className="text-sm">Received</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-lg">
                                <span className="font-semibold">
                                  {(() => {
                                    const tokenSymbol = notification.token;
                                    const amount = notification.amount;

                                    // For HBAR, amount is already formatted, don't apply additional formatting
                                    if (tokenSymbol === "HBAR") {
                                      return `${amount} ${tokenSymbol}`;
                                    }

                                    // For other tokens, use proper decimals from SaucerSwap
                                    const rawNotif = rawNotifications.find(
                                      (n) => n.id === notification.id
                                    );
                                    const tokenId =
                                      rawNotif?.payload?.token_id ||
                                      tokenSymbol;
                                    const decimals =
                                      tokenDecimalsMap.get(tokenId) ?? 0;
                                    const formattedAmount = formatAmount(
                                      amount / Math.pow(10, decimals),
                                      { minimumFractionDigits: 3, maximumFractionDigits: 3 }
                                    );
                                    return `${formattedAmount} ${tokenSymbol}`;
                                  })()}
                                </span>
                              </p>

                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-muted-foreground">
                                  {notification.timestamp}
                                </span>
                                {!notification.isRead && (
                                  <div className="w-3 h-3 bg-primary rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
