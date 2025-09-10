import { useEffect, useRef, useState } from "react";

export type UseOnScreenOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

export const useOnScreen = <T extends Element = Element>(
  options: UseOnScreenOptions = {}
) => {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(node);
    return () => {
      // Cleanly disconnect observer
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [options]);

  return { ref, isIntersecting } as const;
};
