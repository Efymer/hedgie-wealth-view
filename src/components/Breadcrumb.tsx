import React from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onHomeClick }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={16} className="text-muted-foreground/50" />
          )}
          <span
            className={`${
              item.active
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            onClick={() => {
              if (item.label === "Home" && onHomeClick && !item.active) {
                onHomeClick();
              }
            }}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};