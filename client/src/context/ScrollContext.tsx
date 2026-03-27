import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

interface ScrollContextType {
  isScrolling: boolean;
  setScrolling: (scrolling: boolean) => void;
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
  lockHideNav: (locked: boolean) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [hideNav, setHideNavState] = useState(false);
  const lockedRef = useRef(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  // When locked (e.g. keyboard open), scroll cannot un-hide the nav
  const lockHideNav = useCallback((locked: boolean) => {
    lockedRef.current = locked;
  }, []);

  const setHideNav = useCallback((hide: boolean) => {
    setHideNavState(hide);
    lockedRef.current = hide; // lock when hiding via focus
  }, []);

  const setScrolling = useCallback((scrolling: boolean) => {
    setIsScrolling(scrolling);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Don't override if nav is locked (keyboard open)
      if (lockedRef.current) return;

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) > scrollThreshold) {
        if (scrollDelta > 0 && currentScrollY > 100) {
          setHideNavState(true);
        } else if (scrollDelta < 0) {
          setHideNavState(false);
        }
        lastScrollY.current = currentScrollY;
      }

      if (currentScrollY < 50) {
        setHideNavState(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ScrollContext.Provider value={{ isScrolling, setScrolling, hideNav, setHideNav, lockHideNav }}>
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
