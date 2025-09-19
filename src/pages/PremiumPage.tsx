import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, TrendingUp, Users } from "lucide-react";

const PremiumPage: React.FC = () => {
  const premiumFeatures = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Top Holders Analytics",
      description: "Access detailed insights into token holder distribution and whale movements",
      available: true
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Net Worth Over Time",
      description: "Track portfolio performance with comprehensive historical data and trends",
      available: true
    }
  ];

  const handlePurchaseNFT = () => {
    // TODO: Implement NFT purchase logic
    console.log("Purchase NFT clicked");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Crown className="w-8 h-8 text-accent" />
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Premium Access
          </Badge>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
          Unlock Premium Features
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Get exclusive access to advanced analytics and insights with our premium NFT membership. 
          Valid for 30 days from purchase.
        </p>
      </div>

      {/* Premium Features */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {premiumFeatures.map((feature, index) => (
          <Card key={index} className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                {feature.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  {feature.available && (
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Available
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex items-center gap-2 text-success">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Included in Premium</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* NFT Membership Card */}
      <div className="max-w-2xl mx-auto">
        <Card className="glass-card p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
              <Crown className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Premium NFT Membership</h2>
            <p className="text-muted-foreground">
              Unlock all premium features for 30 days with your exclusive NFT
            </p>
          </div>

          <div className="bg-card/50 rounded-lg p-6 mb-6 border border-border/50">
            <div className="text-4xl font-bold mb-2">0.1 HBAR</div>
            <div className="text-muted-foreground">30-day access</div>
          </div>

          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span>Access to Top Holders Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span>Net Worth Over Time tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span>30 days of premium access</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span>Exclusive NFT collectible</span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full text-lg py-6"
            onClick={handlePurchaseNFT}
          >
            <Crown className="w-5 h-5 mr-2" />
            Purchase Premium NFT
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Your NFT will be minted to your connected wallet and grants immediate access to premium features
          </p>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="glass-card p-6 text-left">
            <h4 className="font-semibold mb-2">How long does access last?</h4>
            <p className="text-muted-foreground">
              Your premium access lasts for exactly 30 days from the moment of NFT purchase.
            </p>
          </Card>
          <Card className="glass-card p-6 text-left">
            <h4 className="font-semibold mb-2">Can I transfer my NFT?</h4>
            <p className="text-muted-foreground">
              Yes, premium NFTs are transferable. The new holder will get the remaining access time.
            </p>
          </Card>
          <Card className="glass-card p-6 text-left">
            <h4 className="font-semibold mb-2">What happens when it expires?</h4>
            <p className="text-muted-foreground">
              Premium features become locked again. You can purchase a new NFT to renew access.
            </p>
          </Card>
          <Card className="glass-card p-6 text-left">
            <h4 className="font-semibold mb-2">Is there a discount for renewals?</h4>
            <p className="text-muted-foreground">
              Current NFT holders may receive exclusive renewal offers. Stay tuned for announcements.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;