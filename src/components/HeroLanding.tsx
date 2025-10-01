import React, { useEffect, useState, useRef } from "react";
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
  Coins,
  LineChart,
  Globe,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const HeroLanding: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      {/* Epic Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        
        {/* Animated mesh gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(139, 92, 246, 0.3), transparent 50%)`,
            transition: "background 0.3s ease",
          }}
        />
        
        {/* Floating orbs with dramatic glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-pink-500/30 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Animated grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section - Dramatically Enhanced */}
      <section ref={heroRef} className="relative px-4 pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center space-y-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {/* Badge with glow effect */}
            <div className="flex justify-center animate-fade-in">
              <Badge className="px-6 py-3 text-base bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 text-primary hover:border-primary/50 transition-all duration-300 shadow-lg shadow-primary/20 backdrop-blur-xl">
                <Rocket className="w-5 h-5 mr-2 inline animate-pulse" />
                Built for Hedera Hackathon 2024
              </Badge>
            </div>

            {/* Main Heading - Massive and Bold */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl animate-gradient">
                  HBARWatch
                </span>
              </h1>
              <div className="relative">
                <p className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
                  The Ultimate <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Hedera</span> Network Explorer
                </p>
                <div className="absolute -inset-x-4 -inset-y-2 bg-primary/5 blur-3xl -z-10 rounded-full" />
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Comprehensive wallet analytics, real-time insights, and social features 
                for the <span className="text-primary font-semibold">Hedera ecosystem</span>
              </p>
            </div>

            {/* CTA Buttons - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button 
                size="lg" 
                className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 group shadow-2xl shadow-purple-500/50 border-0 font-bold transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate("/explorer/0.0.98")}
              >
                <Zap className="mr-2 w-6 h-6" />
                Explore Demo Account
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-xl px-12 py-8 border-2 border-primary/50 hover:border-primary backdrop-blur-xl bg-background/50 hover:bg-primary/10 font-bold transform hover:scale-105 transition-all duration-300"
                onClick={() => navigate("/top-holders")}
              >
                <Search className="mr-2 w-6 h-6" />
                Discover Top Holders
              </Button>
            </div>

            {/* Stats Bar - Dramatic 3D Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-16">
              {stats.map((stat, index) => (
                <Card 
                  key={index}
                  className="relative p-8 border-2 border-primary/30 hover:border-primary/60 transition-all duration-500 hover:scale-110 hover:-translate-y-2 group backdrop-blur-xl bg-gradient-to-br from-background/80 to-primary/5 overflow-hidden"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    transform: "perspective(1000px) rotateX(2deg)",
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-3 shadow-lg shadow-primary/50 group-hover:shadow-primary/80 transition-all duration-300">
                      <stat.icon className="w-full h-full text-white" />
                    </div>
                    <div className="text-3xl font-black text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Premium 3D Cards */}
      <section className="relative px-4 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-3 text-base bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-primary/30 backdrop-blur-xl">
              <Globe className="w-5 h-5 mr-2 inline" />
              All Features
            </Badge>
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Everything You Need to Track{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hedera
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Powerful analytics, social features, and real-time insights in one comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`relative p-10 border-2 border-primary/20 hover:border-primary/50 transition-all duration-700 hover:scale-105 hover:-translate-y-4 group backdrop-blur-xl bg-gradient-to-br from-background/90 to-primary/5 overflow-hidden ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ 
                    transitionDelay: `${index * 100}ms`,
                    animationDelay: `${index * 100}ms`,
                    transform: "perspective(1000px) rotateX(2deg)",
                  }}
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 group-hover:to-primary/20 transition-all duration-700" />
                  
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${feature.gradient} blur-3xl -z-10`} />
                  
                  <div className="relative z-10">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.gradient} p-5 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features List - Bento Grid Style */}
      <section className="relative px-4 py-24 md:py-32">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Advanced Capabilities
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Built with the latest technologies for the best user experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Shield, title: "Secure Authentication", desc: "Ed25519 signatures with JWT session management", color: "from-blue-500 to-cyan-500" },
              { icon: Clock, title: "Historical Charts", desc: "Track portfolio performance over time with snapshots", color: "from-purple-500 to-pink-500" },
              { icon: Users, title: "Social Following", desc: "Follow accounts and track their activity in real-time", color: "from-green-500 to-emerald-500" },
              { icon: Search, title: "Quick Search", desc: "Instantly find and explore any Hedera account", color: "from-orange-500 to-red-500" },
              { icon: Activity, title: "Counterparty Maps", desc: "Visualize transaction relationships with force graphs", color: "from-indigo-500 to-purple-500" },
              { icon: Eye, title: "NFT Gallery", desc: "Explore and view NFT collections with detailed metadata", color: "from-yellow-500 to-orange-500" },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative p-8 backdrop-blur-xl bg-gradient-to-br from-background/80 to-background/40 rounded-2xl border-2 border-primary/20 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${item.color} blur-3xl transition-opacity duration-700 -z-10`} />
                
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Epic Call to Action */}
      <section className="relative px-4 py-24 md:py-32">
        {/* Dramatic background */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          <Card className="relative p-16 md:p-20 border-2 border-primary/30 backdrop-blur-xl bg-gradient-to-br from-background/90 to-primary/10 overflow-hidden">
            {/* Animated orbs in background */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            
            <div className="relative z-10">
              <Badge className="mb-8 px-6 py-3 text-base bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-primary/30">
                <LineChart className="w-5 h-5 mr-2 inline" />
                Start Your Journey
              </Badge>
              
              <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                Ready to Explore{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Hedera
                </span>?
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Start tracking your portfolio, discovering top holders, and following accounts today
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 group shadow-2xl shadow-purple-500/50 border-0 font-bold transform hover:scale-110 transition-all duration-300"
                  onClick={() => navigate("/explorer/0.0.98")}
                >
                  <Rocket className="mr-2 w-6 h-6" />
                  Get Started Now
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-xl px-12 py-8 border-2 border-primary/50 hover:border-primary backdrop-blur-xl bg-background/50 hover:bg-primary/10 font-bold transform hover:scale-110 transition-all duration-300"
                  onClick={() => navigate("/top-holders")}
                >
                  <Eye className="mr-2 w-6 h-6" />
                  View Demo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
