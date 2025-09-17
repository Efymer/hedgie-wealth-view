import React, { useState, useMemo } from "react";
import { Bell, User, ArrowUpRight, ArrowDownLeft, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format, isToday, isYesterday, parseISO, startOfDay, isSameDay } from "date-fns";

interface NotificationData {
  id: string;
  accountId: string;
  accountName: string;
  type: 'sent' | 'received';
  amount: string;
  token: string;
  timestamp: string;
  date: Date;
  isRead: boolean;
}

const DUMMY_NOTIFICATIONS: NotificationData[] = [
  {
    id: '1',
    accountId: '0.0.123456',
    accountName: 'John Doe',
    type: 'sent',
    amount: '1,500',
    token: 'HBAR',
    timestamp: '2 minutes ago',
    date: new Date(),
    isRead: false,
  },
  {
    id: '2',
    accountId: '0.0.789012',
    accountName: 'Alice Smith',
    type: 'received',
    amount: '250',
    token: 'USDC',
    timestamp: '15 minutes ago',
    date: new Date(),
    isRead: false,
  },
  {
    id: '3',
    accountId: '0.0.345678',
    accountName: 'Bob Wilson',
    type: 'sent',
    amount: '5,000',
    token: 'HBAR',
    timestamp: '1 hour ago',
    date: new Date(Date.now() - 3600000),
    isRead: true,
  },
  {
    id: '4',
    accountId: '0.0.901234',
    accountName: 'Sarah Johnson',
    type: 'received',
    amount: '100',
    token: 'SAUCE',
    timestamp: '3 hours ago',
    date: new Date(Date.now() - 3 * 3600000),
    isRead: true,
  },
  {
    id: '5',
    accountId: '0.0.567890',
    accountName: 'Mike Brown',
    type: 'sent',
    amount: '750',
    token: 'HBAR',
    timestamp: '1 day ago',
    date: new Date(Date.now() - 86400000),
    isRead: true,
  },
  {
    id: '6',
    accountId: '0.0.234567',
    accountName: 'Emma Davis',
    type: 'received',
    amount: '2,000',
    token: 'HBAR',
    timestamp: '2 days ago',
    date: new Date(Date.now() - 2 * 86400000),
    isRead: true,
  },
  {
    id: '7',
    accountId: '0.0.890123',
    accountName: 'David Miller',
    type: 'sent',
    amount: '500',
    token: 'USDC',
    timestamp: '3 days ago',
    date: new Date(Date.now() - 3 * 86400000),
    isRead: false,
  },
];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>(DUMMY_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = notification.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           notification.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           notification.token.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || notification.type === filterType;
      const matchesRead = filterRead === "all" || 
                         (filterRead === "read" && notification.isRead) ||
                         (filterRead === "unread" && !notification.isRead);
      
      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, searchQuery, filterType, filterRead]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationData[] } = {};
    
    filteredNotifications.forEach(notification => {
      const date = startOfDay(notification.date);
      const key = date.toISOString();
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
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

              <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
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
              <h3 className="text-xl font-semibold mb-2">No notifications found</h3>
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
                  <h2 className="text-lg font-semibold">{formatDateHeader(dateKey)}</h2>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                <div className="space-y-3">
                  {dayNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`transition-all hover:shadow-md cursor-pointer ${
                        !notification.isRead ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
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
                                {notification.accountName}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {notification.accountId}
                              </Badge>
                              {notification.type === 'sent' ? (
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
                                  {notification.amount} {notification.token}
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