import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Search, X, Bookmark, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";

interface BookmarkedVerse {
  number: string;
  text: string;
  reference: string;
}

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
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [animateContent, setAnimateContent] = useState(false);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<BookmarkedVerse | null>(null);
  const [showReflectionCTA, setShowReflectionCTA] = useState(false);
  const urlProcessedRef = useRef(false);
  const [, navigate] = useLocation();
  
  const searchString = useSearch();

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

  // Animate content when chapter loads
  useEffect(() => {
    if (chapterContent) {
      setAnimateContent(false);
      requestAnimationFrame(() => {
        setAnimateContent(true);
      });
    }
  }, [chapterContent?.id]);

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

  // Reset urlProcessedRef when searchString changes
  useEffect(() => {
    if (searchString) {
      urlProcessedRef.current = false;
    }
  }, [searchString]);

  // Handle deep linking from chat
  useEffect(() => {
    if (urlProcessedRef.current || !searchString || !currentVersion || books.length === 0) return;
    
    const params = new URLSearchParams(searchString);
    const bookParam = params.get("book");
    const chapterParam = params.get("chapter");
    const verseParam = params.get("verse");
    
    if (!bookParam || !chapterParam) return;
    
    urlProcessedRef.current = true;
    
    const targetBook = books.find(
      (b) => b.name.toLowerCase() === bookParam.toLowerCase()
    );
    
    if (!targetBook) {
      navigate("/bible", { replace: true });
      return;
    }
    
    setCurrentBook(targetBook);
    
    if (verseParam) {
      setTargetVerse(verseParam.split("-")[0]);
    }
    
    fetch(`/api/bible/${currentVersion.id}/books/${targetBook.id}/chapters`)
      .then((res) => res.json())
      .then((chs: { id: string; number: string; reference: string }[]) => {
        const targetChapterObj = chs.find((c) => c.number === chapterParam);
        if (targetChapterObj) {
          fetch(`/api/bible/${currentVersion.id}/chapters/${targetChapterObj.id}`)
            .then((res) => res.json())
            .then((ch) => {
              setCurrentChapter(ch);
              navigate("/bible", { replace: true });
            });
        }
      });
  }, [searchString, currentVersion, books, setCurrentBook, setCurrentChapter, navigate]);

  // Scroll to target verse when chapter content loads
  useEffect(() => {
    if (targetVerse && chapterContent) {
      setTimeout(() => {
        const verseElement = document.querySelector(`[data-verse="${targetVerse}"]`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedVerse(targetVerse);
          setTimeout(() => {
            setHighlightedVerse(null);
          }, 3000);
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

  const handleVerseClick = (verseNum: string) => {
    setHighlightedVerse(highlightedVerse === verseNum ? null : verseNum);
  };

  const handleBookmark = (verse: { number: string; text: string }) => {
    const verseKey = `${currentChapter?.reference}:${verse.number}`;
    const newBookmarks = new Set(bookmarkedVerses);
    
    if (newBookmarks.has(verseKey)) {
      newBookmarks.delete(verseKey);
      setShowReflectionCTA(false);
    } else {
      newBookmarks.add(verseKey);
      setSelectedVerse({
        number: verse.number,
        text: verse.text,
        reference: `${currentChapter?.reference}:${verse.number}`,
      });
      setShowReflectionCTA(true);
    }
    
    setBookmarkedVerses(newBookmarks);
  };

  const handleReflect = () => {
    if (selectedVerse) {
      // Navigate to chat with the selected verse as context
      navigate(`/chat?verse=${encodeURIComponent(selectedVerse.reference)}&text=${encodeURIComponent(selectedVerse.text)}`);
    }
    setShowReflectionCTA(false);
  };

  const oldTestamentBooks = books.filter((b) => b.testament === "OT");
  const newTestamentBooks = books.filter((b) => b.testament === "NT");

  // Parse verses from content
  const parseVerses = (content: string): { number: string; text: string }[] => {
    if (!content) return [];
    
    const versePattern = /\[(\d+)\]/g;
    const parts = content.split(versePattern);
    const verses: { number: string; text: string }[] = [];
    
    for (let i = 1; i < parts.length; i += 2) {
      const verseNum = parts[i];
      const verseText = (parts[i + 1] || "").trim();
      if (verseNum && verseText) {
        verses.push({ number: verseNum, text: verseText });
      }
    }
    
    return verses;
  };

  if (versionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const verses = currentChapter ? parseVerses(currentChapter.content) : [];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* iOS-style Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        {/* Chapter Title & Version */}
        <div className="text-center py-4">
          <motion.h1 
            className="font-serif text-2xl font-semibold text-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentChapter?.reference || "title"}
          >
            {currentChapter?.reference || "Bible"}
          </motion.h1>
          {currentVersion && (
            <p className="text-xs text-muted-foreground mt-1">
              {currentVersion.name}
            </p>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevChapter}
            disabled={!currentChapter?.previous}
            className="text-primary disabled:text-muted-foreground/30"
            data-testid="button-prev-chapter"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="flex items-center gap-3">
            {/* Book Selector */}
            <Sheet open={bookSheetOpen} onOpenChange={setBookSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-medium"
                  data-testid="button-select-book"
                >
                  {currentBook?.name || "Select Book"}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif">Select Book</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] mt-4">
                  {booksLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Old Testament
                        </h3>
                        <div className="space-y-0.5">
                          {oldTestamentBooks.map((book) => (
                            <Button
                              key={book.id}
                              variant={currentBook?.id === book.id ? "secondary" : "ghost"}
                              className="w-full justify-start font-normal"
                              onClick={() => handleSelectBook(book)}
                              data-testid={`book-${book.abbreviation}`}
                            >
                              {book.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          New Testament
                        </h3>
                        <div className="space-y-0.5">
                          {newTestamentBooks.map((book) => (
                            <Button
                              key={book.id}
                              variant={currentBook?.id === book.id ? "secondary" : "ghost"}
                              className="w-full justify-start font-normal"
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
                  className="min-w-12 font-medium"
                  data-testid="button-select-chapter"
                >
                  {currentChapter?.number || "Ch"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-72 rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle className="font-serif">Select Chapter</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-52 mt-4">
                  <div className="grid grid-cols-6 gap-2 px-2">
                    {chapters.map((ch) => (
                      <Button
                        key={ch.id}
                        variant={currentChapter?.number === ch.number ? "default" : "outline"}
                        size="sm"
                        className="font-medium"
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

            {/* Version Selector */}
            <Select
              value={currentVersion?.id}
              onValueChange={(id) => {
                const version = versions.find((v) => v.id === id);
                if (version) setCurrentVersion(version);
              }}
            >
              <SelectTrigger className="w-20 h-8 text-xs" data-testid="select-version">
                <SelectValue placeholder="Ver" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.abbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextChapter}
            disabled={!currentChapter?.next}
            className="text-primary disabled:text-muted-foreground/30"
            data-testid="button-next-chapter"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Toggle */}
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-muted-foreground"
            data-testid="button-search"
          >
            {searchOpen ? <X className="w-4 h-4 mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            {searchOpen ? "Close" : "Search"}
          </Button>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              className="px-4 py-3 border-t border-border/30"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Search the Bible..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                  data-testid="input-search"
                />
                <Button onClick={handleSearch} disabled={searchLoading} data-testid="button-do-search">
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {!currentChapter && !chapterLoading && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-3">Welcome to the Bible</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Begin your journey through Scripture by selecting a book
            </p>
            <Button 
              onClick={() => setBookSheetOpen(true)} 
              className="px-8"
              data-testid="button-get-started"
            >
              Choose a Book
            </Button>
          </motion.div>
        )}

        {chapterLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {currentChapter && !chapterLoading && verses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: animateContent ? 1 : 0, y: animateContent ? 0 : 12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Scripture Card - iOS style */}
            <Card 
              className="p-6 shadow-lg border-0 bg-card"
              data-testid="card-scripture"
            >
              <div className="space-y-4">
                {verses.map((verse, index) => (
                  <VerseRow
                    key={verse.number}
                    number={verse.number}
                    text={verse.text}
                    isHighlighted={highlightedVerse === verse.number}
                    isBookmarked={bookmarkedVerses.has(`${currentChapter?.reference}:${verse.number}`)}
                    onClick={() => handleVerseClick(verse.number)}
                    onBookmark={() => handleBookmark(verse)}
                    delay={index * 0.02}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div 
              className="mt-6 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Search Results
              </h3>
              {searchResults.map((result: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover-elevate cursor-pointer">
                    <p className="text-sm font-medium text-primary mb-1">{result.reference}</p>
                    <p className="text-sm text-foreground/80 font-serif leading-relaxed">{result.text}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Reflection CTA Overlay */}
      <AnimatePresence>
        {showReflectionCTA && selectedVerse && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-2xl shadow-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Reflect on this verse?</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {selectedVerse.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReflectionCTA(false)}
                      data-testid="button-dismiss-reflect"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReflect}
                      className="bg-primary text-primary-foreground"
                      data-testid="button-reflect"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reflect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Verse Row Component - iOS style with bookmark
function VerseRow({ 
  number, 
  text, 
  isHighlighted, 
  isBookmarked,
  onClick,
  onBookmark,
  delay = 0
}: { 
  number: string; 
  text: string; 
  isHighlighted: boolean; 
  isBookmarked: boolean;
  onClick: () => void;
  onBookmark: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(
        "flex gap-3 p-3 -mx-3 rounded-xl cursor-pointer transition-colors duration-200",
        isHighlighted 
          ? "bg-[hsl(var(--sage)/0.15)]" 
          : "hover:bg-muted/50"
      )}
      onClick={onClick}
      data-verse={number}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileTap={{ scale: 0.99 }}
    >
      <span className="text-xs text-muted-foreground font-medium pt-1 w-5 text-right shrink-0">
        {number}
      </span>
      <div className="flex-1">
        <span className="font-serif text-base leading-relaxed text-foreground/90 block">
          {text}
        </span>
        <div className="flex justify-end mt-2">
          <motion.button
            className={cn(
              "p-1 rounded-md transition-colors",
              isBookmarked ? "text-primary" : "text-muted-foreground/50 hover:text-primary/70"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: isBookmarked ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-testid={`button-bookmark-verse-${number}`}
          >
            <Bookmark 
              className={cn("w-4 h-4", isBookmarked && "fill-current")} 
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
