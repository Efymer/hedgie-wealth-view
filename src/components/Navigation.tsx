import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, TrendingUp, Activity, Menu, X, Crown, Clock } from "lucide-react";
import { NotificationsCenter } from "./NotificationsCenter";
import { WalletConnect } from "./WalletConnect";
import { FollowedAccountsDropdown } from "./FollowedAccountsDropdown";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navigation: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const NavigationLinks = () => (
    <>
      <NavLink
        to="/explorer"
        className={({ isActive }) =>
          `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`
        }
        onClick={() => setIsOpen(false)}
      >
        <Search className="h-4 w-4" />
        <span>Account Explorer</span>
      </NavLink>

      <NavLink
        to="/top-holders"
        className={({ isActive }) =>
          `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`
        }
        onClick={() => setIsOpen(false)}
      >
        <TrendingUp className="h-4 w-4" />
        <span>Top Holders</span>
      </NavLink>

      <NavLink
        to="/waitlist"
        className={({ isActive }) =>
          `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`
        }
        onClick={() => setIsOpen(false)}
      >
        <Clock className="h-4 w-4" />
        <span>Waitlist</span>
      </NavLink>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className="flex items-center space-x-3 text-xl font-semibold text-foreground hover:text-primary transition-colors group"
            >
              <Activity className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="leading-none">hbarwatch.io</span>
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">BETA</Badge>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  The smart explorer for Hedera
                </span>
              </div>
            </NavLink>

            {!isMobile && (
              <div className="flex items-center space-x-2">
                <NavigationLinks />
              </div>
            )}
          </div>

          {isMobile ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavigationLinks />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center space-x-3">
              <FollowedAccountsDropdown />
              {/* <NotificationsCenter />*/}
              <WalletConnect /> 
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
