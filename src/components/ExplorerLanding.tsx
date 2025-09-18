import React from "react";
import { AccountSearch } from "./AccountSearch";
import { Watchlist } from "./Watchlist";
import { Breadcrumb } from "./Breadcrumb";

interface ExplorerLandingProps {
  onSearch: (id: string) => void;
  onSelect: (address: string) => void;
  isSearchLoading?: boolean;
  onHomeClick?: () => void;
}

export const ExplorerLanding: React.FC<ExplorerLandingProps> = ({
  onSearch,
  onSelect,
  isSearchLoading = false,
  onHomeClick,
}) => {
  const breadcrumbItems = [{ label: "Home", active: true }];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative px-6 py-8 md:py-10 text-center">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Network Data
              </div>
              
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="gradient-text">Hedera</span>
                <span className="text-foreground"> Account Explorer</span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive analytics and real-time insights into Hedera network accounts
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span>Token Data</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  <span>Transaction History</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AccountSearch onSearch={onSearch} isLoading={isSearchLoading} />
        <Watchlist onSelect={onSelect} />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-16">
          <p>Built for the Hedera community • Real-time data powered by Hedera APIs</p>
        </div>
      </div>
    </div>
  );
};
