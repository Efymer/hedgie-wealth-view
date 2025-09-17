import React from "react";
import { NavLink } from "react-router-dom";
import { Search, TrendingUp, Home } from "lucide-react";

export const Navigation: React.FC = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink 
              to="/" 
              className="flex items-center space-x-2 text-lg font-bold gradient-text"
            >
              <Home className="h-5 w-5" />
              <span>Hedera Explorer</span>
            </NavLink>
            
            <div className="flex items-center space-x-6">
              <NavLink
                to="/explorer"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <Search className="h-4 w-4" />
                <span>Account Explorer</span>
              </NavLink>
              
              <NavLink
                to="/top-holders"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <TrendingUp className="h-4 w-4" />
                <span>Top Holders</span>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};