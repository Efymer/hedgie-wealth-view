import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, TrendingUp, Activity, Menu, X, Crown, Clock, Sparkles } from "lucide-react";
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
              ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
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
              ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
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
              ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
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
    <nav className="sticky top-0 z-50 glass-card border-b border-primary/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      {/* Gradient overlay similar to hero */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className="flex items-center space-x-3 text-xl font-semibold group"
            >
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center relative overflow-hidden">
                  <Activity className="h-4 w-4 text-primary-foreground" />
                  <div className="absolute inset-0 bg-primary/20 blur-sm group-hover:blur-md transition-all" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="leading-none bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    HBARWatch
                  </span>
                  <div className="glass-card px-2 py-0.5 rounded-full flex items-center gap-1 border border-accent/20">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span className="text-[10px] text-accent font-bold">BETA</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  Hedera Network Explorer
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
              <NotificationsCenter />
              <WalletConnect /> 
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
