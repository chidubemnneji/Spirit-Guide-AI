import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

  const setScrolling = useCallback((scrolling: boolean) => {
    setIsScrolling(scrolling);
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
