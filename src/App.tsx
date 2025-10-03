import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import { HederaExplorer } from "@/components/HederaExplorer";
import { TopHoldersPage } from "@/pages/TopHoldersPage";
import NotificationsPage from "./pages/NotificationsPage";
import PremiumPage from "./pages/PremiumPage";
import AdminPage from "./pages/AdminPage";
import WaitlistPage from "./pages/WaitlistPage";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ScrollToTop from "@/components/ScrollToTop";
import { ReactWalletsProvider } from "@/providers/ReactWalletsProvider";
import { ExplorerLanding } from "./components/Explorer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReactWalletsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/explorer" element={<ExplorerLanding />} />
                <Route path="/explorer/:accountId" element={<HederaExplorer />} />
                <Route path="/account/:accountId" element={<HederaExplorer />} />
                <Route path="/top-holders" element={<TopHoldersPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/waitlist" element={<WaitlistPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
        {import.meta.env.PROD && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </TooltipProvider>
    </ReactWalletsProvider>
  </QueryClientProvider>
);

export default App;
