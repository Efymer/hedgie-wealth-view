import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  TrendingUp, 
  Bell, 
  Users, 
  Shield, 
  Zap,
  Eye,
  PieChart,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  Activity,
  Lock,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const HeroLanding: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: PieChart,
      title: "Portfolio Analytics",
      description: "Real-time net worth tracking with historical charts and diversification analysis",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      title: "Live Price Tracking",
      description: "24h price changes and token data from SaucerSwap API",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Top Holders Discovery",
      description: "Explore largest holders for any Hedera token with comprehensive metadata",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Follow accounts and get instant notifications for transactions",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Wallet,
      title: "HashPack Integration",
      description: "Secure wallet connection with Ed25519 signature verification",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Activity,
      title: "Transaction History",
      description: "Comprehensive transaction analysis with filtering and counterparty mapping",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const stats = [
    { label: "Live Network Data", value: "Real-time", icon: Zap },
    { label: "Token Support", value: "All Hedera", icon: Coins },
    { label: "Secure Auth", value: "JWT + Web3", icon: Lock },
    { label: "Notifications", value: "Instant", icon: Bell },
  ];

  return (
    <div className="min-h-screen w-full overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {/* Badge */}
            <div className="flex justify-center">
              <Badge className="px-4 py-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all duration-300">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Built for Hedera Hackathon 2024
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="gradient-text block">HBARWatch</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                The Ultimate Hedera Network Explorer
              </p>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive wallet analytics, real-time insights, and social features 
                for the Hedera ecosystem
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 group"
                onClick={() => navigate("/explorer/0.0.98")}
              >
                Explore Demo Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/top-holders")}
              >
                <Search className="mr-2 w-5 h-5" />
                Discover Top Holders
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12">
              {stats.map((stat, index) => (
                <Card 
                  key={index}
                  className="glass-card p-6 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 border-secondary/20 text-secondary">
              <Eye className="w-4 h-4 mr-2 inline" />
              All Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Track <span className="gradient-text">Hedera</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful analytics, social features, and real-time insights in one comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`glass-card p-8 border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ 
                    transitionDelay: `${index * 100}ms`,
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features List */}
      <section className="relative px-4 py-16 md:py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Advanced Capabilities</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with the latest technologies for the best user experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: "Secure Authentication", desc: "Ed25519 signatures with JWT session management" },
              { icon: Clock, title: "Historical Charts", desc: "Track portfolio performance over time with snapshots" },
              { icon: Users, title: "Social Following", desc: "Follow accounts and track their activity in real-time" },
              { icon: Search, title: "Quick Search", desc: "Instantly find and explore any Hedera account" },
              { icon: Activity, title: "Counterparty Maps", desc: "Visualize transaction relationships with force graphs" },
              { icon: Eye, title: "NFT Gallery", desc: "Explore and view NFT collections with detailed metadata" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 glass-card rounded-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card p-12 border-primary/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Explore <span className="gradient-text">Hedera</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start tracking your portfolio, discovering top holders, and following accounts today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 group"
                onClick={() => navigate("/explorer/0.0.98")}
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/top-holders")}
              >
                View Demo
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
