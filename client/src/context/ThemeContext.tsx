import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isManualOverride: boolean;
  resetToSystem: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  // Force light mode inside native app WebView
  if (navigator.userAgent.includes("SoulGuide")) return "light";
  // Force light mode if URL has nativeApp param
  if (new URLSearchParams(window.location.search).get("nativeApp")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // null = follow system, "light"/"dark" = manual override
  const [manualTheme, setManualTheme] = useState<Theme | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("theme_override") as Theme | null;
  });

  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  // Listen for OS theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isNativeApp = typeof window !== "undefined" && 
    new URLSearchParams(window.location.search).get("nativeApp") === "1";

  const theme = isNativeApp ? "light" : (manualTheme ?? systemTheme);

  // Apply to DOM
  useEffect(() => {
    if (isNativeApp) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      return;
    }
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [theme, isNativeApp]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setManualTheme(next);
    localStorage.setItem("theme_override", next);
  };

  const setTheme = (newTheme: Theme) => {
    setManualTheme(newTheme);
    localStorage.setItem("theme_override", newTheme);
  };

  const resetToSystem = () => {
    setManualTheme(null);
    localStorage.removeItem("theme_override");
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setTheme,
      isManualOverride: manualTheme !== null,
      resetToSystem,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
