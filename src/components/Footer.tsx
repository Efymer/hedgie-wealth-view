import React from "react";
import { Twitter, Github, Globe, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/20 bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  H
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                hbarwatch.io
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Professional analytics and portfolio tracking for the Hedera
              network. Monitor accounts, analyze token holdings, and track
              market movements with real-time data.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/explorer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Account Explorer
                </a>
              </li>
              <li>
                <a
                  href="/top-holders"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Top Holders
                </a>
              </li>
              {/* <li>
                <a href="/notifications" className="text-muted-foreground hover:text-primary transition-colors">
                  Notifications
                </a>
              </li> */}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="https://x.com/hbarwatchio"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              {/* <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="View our GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a 
                href="https://hedera.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Learn about Hedera"
              >
                <Globe className="h-4 w-4" />
              </a> */}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} hbarwatch.io - Built for the community.
          </div>
          {/* <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div> */}
        </div>
      </div>
    </footer>
  );
};
