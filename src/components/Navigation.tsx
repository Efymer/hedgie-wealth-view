import React from "react";
import { NavLink } from "react-router-dom";
import { Search, TrendingUp, Home, Sparkles } from "lucide-react";
import { NotificationsCenter } from "./NotificationsCenter";

export const Navigation: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink 
              to="/" 
              className="flex items-center space-x-2 text-lg font-bold group"
            >
              <div className="relative">
                <Home className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <Sparkles className="h-2 w-2 text-primary/60 absolute -top-1 -right-1 group-hover:text-primary transition-colors" />
              </div>
              <span className="gradient-text">Hedera Explorer</span>
            </NavLink>
            
            <div className="flex items-center space-x-2">
              <NavLink
                to="/explorer"
                className={({ isActive }) =>
                  `group flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:shadow-md"
                  }`
                }
              >
                <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Account Explorer</span>
              </NavLink>
              
              <NavLink
                to="/top-holders"
                className={({ isActive }) =>
                  `group flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:shadow-md"
                  }`
                }
              >
                <TrendingUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Top Holders</span>
              </NavLink>
            </div>
          </div>
          
          <div className="flex items-center">
            <NotificationsCenter />
          </div>
        </div>
      </div>
    </nav>
  );
};