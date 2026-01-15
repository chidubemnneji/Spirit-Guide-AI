import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useBible } from "@/context/BibleContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Search, X } from "lucide-react";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";

export default function Bible() {
  const {
    currentVersion,
    currentBook,
    currentChapter,
    setCurrentVersion,
    setCurrentBook,
    setCurrentChapter,
  } = useBible();

  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [chapterSheetOpen, setChapterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [targetVerse, setTargetVerse] = useState<string | null>(null);
  const urlProcessedRef = useRef(false);
  
  // Parse URL parameters for deep linking from chat
  const searchString = useSearch();
  const [, navigate] = useLocation();

  // Fetch versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<BibleVersion[]>({
    queryKey: ["/api/bible/versions"],
  });

  // Fetch books when version changes
  const { data: books = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/bible", currentVersion?.id, "books"],
    enabled: !!currentVersion?.id,
  });

  // Fetch chapters for current book
  const { data: chapters = [] } = useQuery<{ id: string; number: string; reference: string }[]>({
    queryKey: ["/api/bible", currentVersion?.id, "books", currentBook?.id, "chapters"],
    enabled: !!currentVersion?.id && !!currentBook?.id,
  });

  // Fetch chapter content
  const { data: chapterContent, isLoading: chapterLoading } = useQuery<Chapter>({
    queryKey: ["/api/bible", currentVersion?.id, "chapters", currentChapter?.id],
    enabled: !!currentVersion?.id && !!currentChapter?.id,
  });

  // Set default version
  useEffect(() => {
    if (versions.length > 0 && !currentVersion) {
      const kjv = versions.find((v) => v.abbreviation.toUpperCase().includes("KJV"));
      setCurrentVersion(kjv || versions[0]);
    }
  }, [versions, currentVersion, setCurrentVersion]);

  // Update chapter when content loads
  useEffect(() => {
    if (chapterContent && chapterContent.id !== currentChapter?.id) {
      setCurrentChapter(chapterContent);
    }
  }, [chapterContent]);

  // Reset urlProcessedRef when searchString changes (for subsequent link clicks)
  useEffect(() => {
    if (searchString) {
      urlProcessedRef.current = false;
    }
  }, [searchString]);

  // Handle deep linking from chat - navigate to specific book/chapter/verse
  useEffect(() => {
    if (urlProcessedRef.current || !searchString || !currentVersion || books.length === 0) return;
    
    const params = new URLSearchParams(searchString);
    const bookParam = params.get("book");
    const chapterParam = params.get("chapter");
    const verseParam = params.get("verse");
    
    if (!bookParam || !chapterParam) return;
    
    urlProcessedRef.current = true;
    
    // Find the matching book
    const targetBook = books.find(
      (b) => b.name.toLowerCase() === bookParam.toLowerCase()
    );
    
    if (!targetBook) {
      console.log("Book not found:", bookParam);
      // Clear URL params
      navigate("/bible", { replace: true });
      return;
    }
    
    // Set book and fetch chapters
    setCurrentBook(targetBook);
    
    // Store target verse for scrolling later
    if (verseParam) {
      setTargetVerse(verseParam.split("-")[0]); // Use first verse if range
    }
    
    // Fetch chapters for this book and navigate to the specified chapter
    fetch(`/api/bible/${currentVersion.id}/books/${targetBook.id}/chapters`)
      .then((res) => res.json())
      .then((chs: { id: string; number: string; reference: string }[]) => {
        const targetChapterObj = chs.find((c) => c.number === chapterParam);
        if (targetChapterObj) {
          fetch(`/api/bible/${currentVersion.id}/chapters/${targetChapterObj.id}`)
            .then((res) => res.json())
            .then((ch) => {
              setCurrentChapter(ch);
              // Clear URL params after navigation
              navigate("/bible", { replace: true });
            });
        }
      });
  }, [searchString, currentVersion, books, setCurrentBook, setCurrentChapter, navigate]);

  // Scroll to target verse when chapter content loads
  useEffect(() => {
    if (targetVerse && chapterContent) {
      // Give DOM time to render
      setTimeout(() => {
        const verseElement = document.querySelector(`[data-verse="${targetVerse}"]`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight the verse briefly
          verseElement.classList.add("bg-primary/20", "transition-colors", "duration-500");
          setTimeout(() => {
            verseElement.classList.remove("bg-primary/20");
          }, 2000);
        }
        setTargetVerse(null);
      }, 300);
    }
  }, [targetVerse, chapterContent]);

  // Search results
  const { data: searchResults = [], isLoading: searchLoading, refetch: doSearch } = useQuery<any[]>({
    queryKey: ["/api/bible", currentVersion?.id, "search", { query: searchQuery }],
    enabled: false,
  });

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && currentVersion) {
      doSearch();
    }
  }, [searchQuery, currentVersion, doSearch]);

  const handleSelectBook = (book: Book) => {
    setCurrentBook(book);
    setBookSheetOpen(false);
    // Auto-select first chapter
    if (currentVersion) {
      fetch(`/api/bible/${currentVersion.id}/books/${book.id}/chapters`)
        .then((res) => res.json())
        .then((chs) => {
          if (chs.length > 0) {
            const firstChapter = chs.find((c: any) => c.number === "1") || chs[0];
            fetch(`/api/bible/${currentVersion.id}/chapters/${firstChapter.id}`)
              .then((res) => res.json())
              .then((ch) => setCurrentChapter(ch));
          }
        });
    }
  };

  const handleSelectChapter = (chapterId: string) => {
    if (currentVersion) {
      fetch(`/api/bible/${currentVersion.id}/chapters/${chapterId}`)
        .then((res) => res.json())
        .then((ch) => setCurrentChapter(ch));
      setChapterSheetOpen(false);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter?.previous && currentVersion) {
      fetch(`/api/bible/${currentVersion.id}/chapters/${currentChapter.previous.id}`)
        .then((res) => res.json())
        .then((ch) => setCurrentChapter(ch));
    }
  };

  const handleNextChapter = () => {
    if (currentChapter?.next && currentVersion) {
      fetch(`/api/bible/${currentVersion.id}/chapters/${currentChapter.next.id}`)
        .then((res) => res.json())
        .then((ch) => setCurrentChapter(ch));
    }
  };

  const oldTestamentBooks = books.filter((b) => b.testament === "OT");
  const newTestamentBooks = books.filter((b) => b.testament === "NT");

  // Parse chapter content for verse formatting with data-verse attributes for deep linking
  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Split by verse numbers and format
    const versePattern = /\[(\d+)\]/g;
    const parts = content.split(versePattern);
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      // Odd indices are verse numbers
      if (i % 2 === 1) {
        const verseNum = parts[i];
        const verseText = parts[i + 1] || "";
        
        // Wrap the verse number and its text in a span with data-verse
        result.push(
          <span key={i} data-verse={verseNum} className="inline">
            <sup className="text-primary/70 font-medium mr-1 text-xs">
              {verseNum}
            </sup>
            <span>{verseText}</span>
          </span>
        );
        i++; // Skip the next text part since we already included it
      } else if (i === 0 && parts[i]) {
        // Text before any verse number (if any)
        result.push(<span key={i}>{parts[i]}</span>);
      }
    }
    
    return result;
  };

  if (versionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14 gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold">Bible</span>
          </div>
          
          {/* Version Selector */}
          <Select
            value={currentVersion?.id}
            onValueChange={(id) => {
              const version = versions.find((v) => v.id === id);
              if (version) setCurrentVersion(version);
            }}
          >
            <SelectTrigger className="w-24" data-testid="select-version">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-search"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="px-4 py-2 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Search the Bible..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search"
              />
              <Button onClick={handleSearch} disabled={searchLoading} data-testid="button-do-search">
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>
        )}

        {/* Book/Chapter Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevChapter}
            disabled={!currentChapter?.previous}
            data-testid="button-prev-chapter"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Book Selector */}
            <Sheet open={bookSheetOpen} onOpenChange={setBookSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-select-book">
                  {currentBook?.name || "Select Book"}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Select Book</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] mt-4">
                  {booksLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                          Old Testament
                        </h3>
                        <div className="space-y-1">
                          {oldTestamentBooks.map((book) => (
                            <Button
                              key={book.id}
                              variant={currentBook?.id === book.id ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => handleSelectBook(book)}
                              data-testid={`book-${book.abbreviation}`}
                            >
                              {book.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                          New Testament
                        </h3>
                        <div className="space-y-1">
                          {newTestamentBooks.map((book) => (
                            <Button
                              key={book.id}
                              variant={currentBook?.id === book.id ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => handleSelectBook(book)}
                              data-testid={`book-${book.abbreviation}`}
                            >
                              {book.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Chapter Selector */}
            <Sheet open={chapterSheetOpen} onOpenChange={setChapterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentBook}
                  data-testid="button-select-chapter"
                >
                  {currentChapter?.number || "Ch"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-64">
                <SheetHeader>
                  <SheetTitle>Select Chapter</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-48 mt-4">
                  <div className="grid grid-cols-6 gap-2">
                    {chapters.map((ch) => (
                      <Button
                        key={ch.id}
                        variant={currentChapter?.number === ch.number ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleSelectChapter(ch.id)}
                        data-testid={`chapter-${ch.number}`}
                      >
                        {ch.number}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextChapter}
            disabled={!currentChapter?.next}
            data-testid="button-next-chapter"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {!currentChapter && !chapterLoading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">Welcome to the Bible</h2>
            <p className="text-muted-foreground mb-4">
              Select a book to start reading
            </p>
            <Button onClick={() => setBookSheetOpen(true)} data-testid="button-get-started">
              Choose a Book
            </Button>
          </div>
        )}

        {chapterLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {currentChapter && !chapterLoading && (
          <Card className="p-6">
            <h2 className="font-serif text-2xl font-semibold mb-4" data-testid="text-chapter-reference">
              {currentChapter.reference}
            </h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground"
              data-testid="text-chapter-content"
            >
              {formatContent(currentChapter.content)}
            </div>
          </Card>
        )}

        {/* Search Results */}
        {searchOpen && searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Search Results</h3>
            {searchResults.map((result: any, index: number) => (
              <Card key={index} className="p-4">
                <p className="text-sm font-medium text-primary mb-1">{result.reference}</p>
                <p className="text-sm text-muted-foreground">{result.text}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
