import React, { useState } from "react";
import { Wallet, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { WalletConnectModal } from "@/components/WalletConnectModal";

export const WalletConnect: React.FC = () => {
  const navigate = useNavigate();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const {
    isConnected,
    accountId,
    isLoading,
    connectAndAuthenticate,
    disconnect,
  } = useWalletAuth({
    onSuccess: () => {
      setShowConnectModal(false);
    },
  });

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConnectModal(true);
  };

  const handleModalConnect = async () => {
    await connectAndAuthenticate();
  };


  return (
    <>
      {!isConnected || isLoading ? (
        <Button
          onClick={handleConnect}
          className="flex items-center space-x-2"
          size="sm"
          disabled={isLoading}
        >
          <Wallet className="h-4 w-4" />
          <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
        </Button>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center space-x-2 hover:bg-accent/10 hover:text-accent-foreground transition-colors"
              size="sm"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <Wallet className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">Connected</span>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Account ID</span>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {accountId}
                </p>
              </div>

              <Button
                variant="default"
                onClick={() => navigate(`/explorer/${accountId}`)}
                className="w-full flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>View Portfolio</span>
              </Button>

              <Button
                variant="outline"
                onClick={disconnect}
                className="w-full flex items-center space-x-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <WalletConnectModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onConnect={handleModalConnect}
        isLoading={isLoading}
        title="Connect Your Wallet"
        description="Connect your Hedera wallet to access all features of the application, including notifications and account following."
      />
    </>
  );
};
