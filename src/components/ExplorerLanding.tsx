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
        <Breadcrumb items={breadcrumbItems} onHomeClick={onHomeClick} />
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">Hedera Explorer</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time account balances and token holdings on the Hedera network
          </p>
        </div>
        <AccountSearch onSearch={onSearch} isLoading={isSearchLoading} />
        <Watchlist onSelect={onSelect} />
      </div>
    </div>
  );
};
