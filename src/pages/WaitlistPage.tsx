import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Twitter, TrendingUp, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WaitlistPage = () => {
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId.trim()) {
      toast({
        title: "Account ID Required",
        description: "Please enter your Hedera account ID",
        variant: "destructive",
      });
      return;
    }

    if (!hasFollowed) {
      toast({
        title: "Follow Required",
        description: "Please follow @hbarwatch on Twitter to join the waitlist",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Mock submission
    setTimeout(() => {
      toast({
        title: "Welcome to the Waitlist!",
        description: "You've been added to our exclusive waitlist. We'll notify you when features are available!",
      });
      setIsSubmitting(false);
      setAccountId('');
    }, 1500);
  };

  const handleFollowClick = () => {
    window.open('https://twitter.com/hbarwatch', '_blank');
    setHasFollowed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Clock className="h-3 w-3 mr-1" />
            Exclusive Access
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Join the Waitlist
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get early access to exclusive features and advanced analytics for your Hedera portfolio
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Waitlist Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Waitlist
              </CardTitle>
              <CardDescription>
                Enter your details to get exclusive early access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Hedera Account ID</Label>
                  <Input
                    id="accountId"
                    type="text"
                    placeholder="0.0.123456"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your Hedera account ID (format: 0.0.123456)
                  </p>
                </div>

                {/* Twitter Follow Requirement */}
                <div className="space-y-3">
                  <Label>Requirements</Label>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Twitter className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Follow @hbarwatch on Twitter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasFollowed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFollowClick}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join Waitlist"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Exclusive Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Exclusive Features
              </CardTitle>
              <CardDescription>
                What you'll get with waitlist access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Net Worth Over Time</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your portfolio's historical performance with detailed charts and analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Advanced Portfolio Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Deep insights into your holdings, performance metrics, and investment patterns
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get priority access to new features and dedicated customer support
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Join now and be among the first to experience premium portfolio tracking
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Already have an account? <a href="/explorer" className="text-primary hover:underline">Explore now</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage;