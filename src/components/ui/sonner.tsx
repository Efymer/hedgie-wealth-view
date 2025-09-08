import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--toast-background))] group-[.toaster]:text-[hsl(var(--toast-foreground))] group-[.toaster]:border-[hsl(var(--toast-border))] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-[hsl(var(--toast-success-background))] group-[.toaster]:text-[hsl(var(--toast-success-foreground))] group-[.toaster]:border-[hsl(var(--toast-success-border))]",
          error: "group-[.toaster]:bg-[hsl(var(--toast-destructive-background))] group-[.toaster]:text-[hsl(var(--toast-destructive-foreground))] group-[.toaster]:border-[hsl(var(--toast-destructive-border))]",
          warning: "group-[.toaster]:bg-[hsl(var(--toast-warning-background))] group-[.toaster]:text-[hsl(var(--toast-warning-foreground))] group-[.toaster]:border-[hsl(var(--toast-warning-border))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
