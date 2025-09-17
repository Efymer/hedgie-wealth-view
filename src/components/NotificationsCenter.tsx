import React, { useState } from "react";
import { Bell, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NotificationData {
  id: string;
  accountId: string;
  accountName: string;
  type: 'sent' | 'received';
  amount: string;
  token: string;
  timestamp: string;
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
    isRead: true,
  },
];

export const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>(DUMMY_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-muted/80"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
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
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
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
                            {notification.accountName}
                          </p>
                          {notification.type === 'sent' ? (
                            <ArrowUpRight className="h-3 w-3 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {notification.accountId}
                        </p>
                        
                        <p className="text-sm mt-1">
                          {notification.type === 'sent' ? 'Sent' : 'Received'}{' '}
                          <span className="font-medium">
                            {notification.amount} {notification.token}
                          </span>
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};