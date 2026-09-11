import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TextSize = "sm" | "md" | "lg" | "xl";

interface TextSizeContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

const SCALE: Record<TextSize, string> = {
  sm: "0.9",
  md: "1",
  lg: "1.15",
  xl: "1.3",
};

function getStoredTextSize(): TextSize {
  if (typeof window === "undefined") return "md";
  const stored = localStorage.getItem("reading_text_size");
  if (stored === "sm" || stored === "md" || stored === "lg" || stored === "xl") return stored;
  return "md";
}

// Controls the size of Scripture, devotional, and journal reading text
// app-wide, independent of the rest of the UI — a common need in faith apps
// whose audience skews toward readers who want larger type without the
// whole interface changing scale.
export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(getStoredTextSize);

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-scale", SCALE[textSize]);
  }, [textSize]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem("reading_text_size", size);
  };

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (context === undefined) {
    throw new Error("useTextSize must be used within a TextSizeProvider");
  }
  return context;
}
