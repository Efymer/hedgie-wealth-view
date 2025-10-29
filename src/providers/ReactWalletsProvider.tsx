import React, { PropsWithChildren } from "react";
import { HWBridgeProvider } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { HederaMainnet, HederaTestnet } from "@buidlerlabs/hashgraph-react-wallets/chains";

const metadata = {
  name: "hbarwatch.io",
  description: "Hedera portfolio and notifications",
  icons: ["DAppLogo.png"],
  url: typeof window !== "undefined" ? window.location.href : "https://hbarwatch.io",
};

export const ReactWalletsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  type Env = { VITE_HEDERA_NETWORK?: string };
  const env: Env | undefined = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Env }).env : undefined;
  const isTestnet = (env?.VITE_HEDERA_NETWORK || "testnet") === "testnet";

  return (
    <HWBridgeProvider
      metadata={metadata}
      projectId={"655429453a17835dec55d8f12364aa81"}
      connectors={[HashpackConnector]}
      chains={[isTestnet ? HederaTestnet : HederaMainnet]}
    >
      {children}
    </HWBridgeProvider>
  );
};
