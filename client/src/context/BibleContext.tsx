import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";

interface BibleContextType {
  currentVersion: BibleVersion | null;
  currentBook: Book | null;
  currentChapter: Chapter | null;
  versions: BibleVersion[];
  books: Book[];
  isLoading: boolean;
  error: string | null;
  setCurrentVersion: (version: BibleVersion) => void;
  setCurrentBook: (book: Book) => void;
  setCurrentChapter: (chapter: Chapter) => void;
  setVersions: (versions: BibleVersion[]) => void;
  setBooks: (books: Book[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: ReactNode }) {
  const [currentVersion, setCurrentVersion] = useState<BibleVersion | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <BibleContext.Provider
      value={{
        currentVersion,
        currentBook,
        currentChapter,
        versions,
        books,
        isLoading,
        error,
        setCurrentVersion,
        setCurrentBook,
        setCurrentChapter,
        setVersions,
        setBooks,
        setIsLoading,
        setError,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error("useBible must be used within a BibleProvider");
  }
  return context;
}
