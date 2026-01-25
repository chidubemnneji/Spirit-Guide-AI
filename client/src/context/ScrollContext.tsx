import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

interface ScrollContextType {
  isScrolling: boolean;
  setScrolling: (scrolling: boolean) => void;
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const setScrolling = useCallback((scrolling: boolean) => {
    setIsScrolling(scrolling);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) > scrollThreshold) {
        if (scrollDelta > 0 && currentScrollY > 100) {
          setHideNav(true);
        } else if (scrollDelta < 0) {
          setHideNav(false);
        }
        lastScrollY.current = currentScrollY;
      }

      if (currentScrollY < 50) {
        setHideNav(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ScrollContext.Provider value={{ isScrolling, setScrolling, hideNav, setHideNav }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used within a ScrollProvider");
  }
  return context;
}
