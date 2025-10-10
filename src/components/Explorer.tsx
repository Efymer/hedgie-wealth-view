import React from "react";
import { AccountSearch } from "./AccountSearch";
import { Watchlist } from "./Watchlist";
import { Breadcrumb } from "./Breadcrumb";

interface ExplorerLandingProps {
  onSearch: (id: string) => void;
  onSelect: (address: string) => void;
  isSearchLoading?: boolean;
}

export const ExplorerLanding: React.FC<ExplorerLandingProps> = ({
  onSelect,
  onSearch,
  isSearchLoading = false,
}) => {
  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <AccountSearch onSearch={onSearch} isLoading={isSearchLoading} />
        <Watchlist onSelect={onSelect} />
      </div>
    </div>
  );
};
