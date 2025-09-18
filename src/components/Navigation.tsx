import React from "react";
import { NavLink } from "react-router-dom";
import { Search, TrendingUp, Activity } from "lucide-react";
import { NotificationsCenter } from "./NotificationsCenter";
import { WalletConnect } from "./WalletConnect";
import { FollowedAccountsDropdown } from "./FollowedAccountsDropdown";

export const Navigation: React.FC = () => {
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
                <span className="leading-none">hbarwatch.io</span>
                <span className="text-xs text-muted-foreground font-normal">
                  The smart explorer for Hedera
                </span>
              </div>
            </NavLink>

            <div className="flex items-center space-x-2">
              <NavLink
                to="/explorer"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`
                }
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
              >
                <TrendingUp className="h-4 w-4" />
                <span>Top Holders</span>
              </NavLink>
            </div>
          </div>

          {/* <div className="flex items-center space-x-3">
            <FollowedAccountsDropdown />
            <NotificationsCenter />
            <WalletConnect />
          </div> */}
        </div>
      </div>
    </nav>
  );
};
