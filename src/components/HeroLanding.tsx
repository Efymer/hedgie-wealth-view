import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, Users, Bell, Star, Moon, Smartphone,
  BarChart3, Shield, Zap, Activity, Globe, ArrowRight,
  Eye, Target, Rocket, Check, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return { count, ref };
};

// Particle background component
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export const HeroLanding = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const stats = [
    { value: 1000000, label: "Hedera Accounts Tracked", suffix: "+" },
    { value: 100, label: "Real-time Analytics", suffix: "%" },
    { value: 24, label: "Network Monitoring", suffix: "/7" },
    { value: 99, label: "Uptime Guarantee", suffix: ".9%" },
  ];

  const mainFeatures = [
    {
      icon: BarChart3,
      title: "Portfolio & Analytics",
      description: "Real-time net worth tracking, portfolio diversification charts, and comprehensive transaction history",
      gradient: "from-blue-500/20 to-cyan-500/20",
      features: ["Net Worth Tracking", "Diversification Charts", "Token Prices", "Transaction History"]
    },
    {
      icon: Target,
      title: "Top Holders & Discovery",
      description: "Explore largest token holders, comprehensive token metadata, and NFT galleries",
      gradient: "from-purple-500/20 to-pink-500/20",
      features: ["Top Token Holders", "Token Information", "Account Search", "NFT Gallery"]
    },
    {
      icon: Users,
      title: "Social & Notifications",
      description: "Follow accounts, real-time activity notifications, and secure wallet-based authentication",
      gradient: "from-green-500/20 to-emerald-500/20",
      features: ["Follow System", "Real-time Notifications", "Notification Center", "Social Auth"]
    },
    {
      icon: Shield,
      title: "Wallet Integration",
      description: "Secure HashPack integration with Ed25519 signature verification and JWT session management",
      gradient: "from-orange-500/20 to-red-500/20",
      features: ["HashPack Support", "Secure Auth", "Session Management", "Connection Modal"]
    },
  ];

  const advancedFeatures = [
    { icon: Star, title: "Watchlist Management", description: "Track favorite accounts and tokens" },
    { icon: Moon, title: "Dark Mode", description: "Full theme switching with system detection" },
    { icon: Smartphone, title: "Responsive Design", description: "Mobile-first UI across all devices" },
  ];

  const techStack = [
    { name: "Hedera", color: "from-purple-500 to-purple-600" },
    { name: "HashPack", color: "from-blue-500 to-blue-600" },
    { name: "SaucerSwap", color: "from-green-500 to-green-600" },
    { name: "React", color: "from-cyan-500 to-cyan-600" },
    { name: "TypeScript", color: "from-blue-400 to-blue-500" },
    { name: "Tailwind", color: "from-teal-500 to-teal-600" },
  ];

  const timeline = [
    { phase: "Phase 1", title: "Basic Tracking", description: "Account balances and transactions" },
    { phase: "Phase 2", title: "Analytics", description: "Portfolio insights and charts" },
    { phase: "Phase 3", title: "Social Features", description: "Follow system and notifications" },
    { phase: "Phase 4", title: "Advanced", description: "Top holders and discovery tools" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background opacity-50" />
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-primary/10"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
      >
        <div className="max-w-7xl mx-auto text-center space-y-8 z-10">
          {/* Animated Hedera Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-primary via-accent to-primary rounded-full p-1"
              >
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                  <Activity className="w-12 h-12 text-primary" />
                </div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-7xl md:text-9xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                HBARWatch
              </span>
            </h1>
            <p className="text-2xl md:text-4xl text-muted-foreground mb-4">
              The Ultimate Hedera Network Explorer
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive portfolio tracking, social features, and real-time insights for the entire Hedera ecosystem
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/explorer/0.0.1234')}
              className="group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-accent/50 to-primary/50"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative flex items-center gap-2">
                Try Demo Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <div className="glass-card p-2 rounded-lg">
              <WalletConnect />
            </div>

            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/top-holders')}
              className="px-8 py-6 text-lg border-2"
            >
              <Eye className="w-5 h-5 mr-2" />
              Explore Top Holders
            </Button>
          </motion.div>

          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap gap-3 justify-center text-sm"
          >
            {["Real-time Analytics", "Social Features", "Secure Wallet Auth", "NFT Support"].map((badge, i) => (
              <motion.div
                key={badge}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="glass-card px-4 py-2 rounded-full flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                {badge}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Animated Stats Section */}
      <section ref={statsRef} className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => {
              const { count, ref } = useCounter(stat.value);
              return (
                <motion.div
                  key={stat.label}
                  ref={ref}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="glass-card p-8 rounded-2xl text-center relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="relative z-10">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent mb-2">
                      {count.toLocaleString()}{stat.suffix}
                    </div>
                    <div className="text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Interactive Feature Showcase Grid */}
      <section ref={featuresRef} className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need to track and analyze the Hedera ecosystem</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, rotateX: 2 }}
                className="group"
              >
                <Card className="glass-card p-8 h-full relative overflow-hidden">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="inline-block mb-6"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                        <feature.icon className="w-8 h-8 text-primary" />
                      </div>
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    
                    <div className="space-y-2">
                      {feature.features.map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-accent" />
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features - Floating Cards */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-12"
          >
            Advanced Capabilities
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-card p-6 rounded-xl backdrop-blur-xl relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                />
                <div className="relative z-10">
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Evolution Timeline */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Development Journey
          </motion.h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary via-accent to-primary hidden md:block" />

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className="flex-1 glass-card p-6 rounded-xl">
                    <div className="text-sm text-accent font-bold mb-2">{item.phase}</div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    className="hidden md:block w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center z-10"
                  >
                    <Zap className="w-6 h-6 text-background" />
                  </motion.div>
                  
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powered By</h2>
            <p className="text-xl text-muted-foreground">Built with cutting-edge technology</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative group"
              >
                <div className={`glass-card px-8 py-4 rounded-full bg-gradient-to-r ${tech.color} relative overflow-hidden`}>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10 font-bold text-lg text-white">{tech.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-background" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl"
          />
          
          <div className="glass-card p-12 rounded-3xl relative">
            <Rocket className="w-20 h-20 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Explore?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of Hedera network exploration. Track portfolios, discover opportunities, and stay connected with the ecosystem.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/explorer/0.0.1234')}
                className="px-8 py-6 text-lg group"
              >
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Start Exploring
                </motion.span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="glass-card p-2 rounded-lg">
                <WalletConnect />
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
