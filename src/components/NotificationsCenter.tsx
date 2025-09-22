import React, { useMemo, useState } from "react";
import { Bell, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGQLQuery, useGQLMutation } from "@/lib/graphql";

type GqlNotification = {
  id: string;
  account_id: string;
  direction: 'sent' | 'received';
  token: string | null;
  amount: number | null;
  consensus_ts: string;
  created_at: string;
};

const Q_NOTIFICATIONS = /* GraphQL */ `
  query MyNotifications {
    notifications(order_by: { consensus_ts: desc }, limit: 50) {
      id
      account_id
      direction
      token
      amount
      consensus_ts
      created_at
    }
  }
`;

const Q_LAST_SEEN = /* GraphQL */ `
  query LastSeen {
    notification_last_seen(limit: 1) { user_id last_seen_consensus_ts }
  }
`;

const M_MARK_SEEN = /* GraphQL */ `
  mutation MarkSeen($ts: String!) {
    insert_notification_last_seen_one(
      object: { last_seen_consensus_ts: $ts }
      on_conflict: { constraint: notification_last_seen_pkey, update_columns: [last_seen_consensus_ts] }
    ) { user_id last_seen_consensus_ts }
  }
`;

export const NotificationsCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Poll latest notifications (every 10s)
  const { data: notifData } = useGQLQuery<{ notifications: GqlNotification[] }>(
    ["notifications", { limit: 50 }],
    Q_NOTIFICATIONS,
    undefined,
    { refetchInterval: 10_000, staleTime: 5_000 }
  );
  const notifications = useMemo(() => notifData?.notifications ?? [], [notifData]);

  // Last seen pointer via GraphQL + React Query helper
  const { data: lastSeenData, refetch: refetchLastSeen } = useGQLQuery<{ notification_last_seen: { user_id: string; last_seen_consensus_ts: string }[] }>(
    ["notification_last_seen"],
    Q_LAST_SEEN,
    undefined,
    { staleTime: 15_000, refetchInterval: 15_000 }
  );

  const latestTs = notifications[0]?.consensus_ts;
  const lastSeenTs = lastSeenData?.notification_last_seen?.[0]?.last_seen_consensus_ts || null;

  const unreadCount = useMemo(() => {
    if (!lastSeenTs) return notifications.length;
    return notifications.filter(n => n.consensus_ts > lastSeenTs).length;
  }, [notifications, lastSeenTs]);

  const markSeenMut = useGQLMutation(M_MARK_SEEN);

  const markAllAsRead = async () => {
    if (!latestTs) return;
    await markSeenMut.mutateAsync({ ts: latestTs });
    await refetchLastSeen();
  };

  const markOneAsRead = async (ts: string) => {
    await markSeenMut.mutateAsync({ ts });
    await refetchLastSeen();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-muted/80">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground">
                Mark all as read
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Activity from accounts you follow</p>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Follow accounts to get notified of their transactions</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((n, index) => {
                const isUnread = !lastSeenTs || n.consensus_ts > lastSeenTs;
                return (
                  <div key={n.id}>
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? 'bg-primary/5' : ''}`}
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
                            <p className="text-sm font-medium truncate">{n.account_id}</p>
                            {n.direction === 'sent' ? (
                              <ArrowUpRight className="h-3 w-3 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm mt-1">
                            {n.direction === 'sent' ? 'Sent' : 'Received'}{' '}
                            <span className="font-medium">{n.amount ?? 0} {n.token ?? 'HBAR'}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{n.consensus_ts}</p>
                        </div>
                        {isUnread && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-1" />}
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
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};