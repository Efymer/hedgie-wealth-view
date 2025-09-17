import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls window to top on every route change.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Ensure browser doesn't auto-restore scroll position
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // ignore if not supported
    }
  }, []);

  useEffect(() => {
    // Reset scroll to top-left instantly on navigation
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
