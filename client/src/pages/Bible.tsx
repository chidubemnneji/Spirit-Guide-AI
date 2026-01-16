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
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Search, X, Bookmark, MessageCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";

interface BookmarkedVerse {
  number: string;
  text: string;
  reference: string;
}

interface BookmarkGroup {
  id: string;
  verses: { number: string; text: string }[];
  reference: string;
  dateSaved: Date;
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
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(new Set());
  const [animateContent, setAnimateContent] = useState(false);
  const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkGroup[]>([]);
  const [bookmarksSheetOpen, setBookmarksSheetOpen] = useState(false);
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
          setHighlightedVerses(new Set([targetVerse]));
          setTimeout(() => {
            setHighlightedVerses(new Set());
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

  // Toggle verse highlight on tap
  const handleVerseClick = (verseNum: string) => {
    const newHighlighted = new Set(highlightedVerses);
    if (newHighlighted.has(verseNum)) {
      newHighlighted.delete(verseNum);
    } else {
      newHighlighted.add(verseNum);
    }
    setHighlightedVerses(newHighlighted);
  };

  // Save highlighted verses as a bookmark group
  const handleSaveHighlighted = (verses: { number: string; text: string }[]) => {
    if (highlightedVerses.size === 0 || !currentChapter) return;
    
    const selectedVerses = verses.filter(v => highlightedVerses.has(v.number));
    if (selectedVerses.length === 0) return;
    
    const sortedVerses = selectedVerses.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const firstVerse = sortedVerses[0].number;
    const lastVerse = sortedVerses[sortedVerses.length - 1].number;
    const reference = firstVerse === lastVerse 
      ? `${currentChapter.reference}:${firstVerse}`
      : `${currentChapter.reference}:${firstVerse}-${lastVerse}`;
    
    const newBookmark: BookmarkGroup = {
      id: `${reference}-${Date.now()}`,
      verses: sortedVerses,
      reference,
      dateSaved: new Date(),
    };
    
    setBookmarkGroups([...bookmarkGroups, newBookmark]);
    setHighlightedVerses(new Set());
  };

  // Reflect on highlighted verses
  const handleReflectHighlighted = (verses: { number: string; text: string }[]) => {
    if (highlightedVerses.size === 0 || !currentChapter) return;
    
    const selectedVerses = verses.filter(v => highlightedVerses.has(v.number));
    if (selectedVerses.length === 0) return;
    
    const sortedVerses = selectedVerses.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const firstVerse = sortedVerses[0].number;
    const lastVerse = sortedVerses[sortedVerses.length - 1].number;
    const reference = firstVerse === lastVerse 
      ? `${currentChapter.reference}:${firstVerse}`
      : `${currentChapter.reference}:${firstVerse}-${lastVerse}`;
    const combinedText = sortedVerses.map(v => `${v.number}. ${v.text}`).join(" ");
    
    navigate(`/chat?verse=${encodeURIComponent(reference)}&text=${encodeURIComponent(combinedText)}`);
    setHighlightedVerses(new Set());
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

  // Group short verses together (max 4 lines estimated)
  const groupShortVerses = (verses: { number: string; text: string }[]): { number: string; text: string }[][] => {
    const result: { number: string; text: string }[][] = [];
    let buffer: { number: string; text: string }[] = [];
    const CHARS_PER_LINE = 50;
    const MAX_LINES = 4;

    for (const verse of verses) {
      buffer.push(verse);
      
      // Estimate total lines in buffer
      const totalChars = buffer.reduce((sum, v) => sum + v.text.length, 0);
      const estimatedLines = Math.ceil(totalChars / CHARS_PER_LINE);
      
      if (estimatedLines >= MAX_LINES) {
        result.push(buffer);
        buffer = [];
      }
    }
    
    if (buffer.length > 0) {
      result.push(buffer);
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

  const verses = currentChapter ? parseVerses(currentChapter.content) : [];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* iOS-style Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        {/* Chapter Title & Version with Bookmark on Right */}
        <div className="flex items-center justify-between py-4 px-4">
          <div className="w-10" /> {/* Spacer for balance */}
          <div className="text-center flex-1">
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
          {/* Bookmarks Icon - Right Side */}
          <Sheet open={bookmarksSheetOpen} onOpenChange={setBookmarksSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                data-testid="button-open-bookmarks"
              >
                <Bookmark className={cn("w-7 h-7", bookmarkGroups.length > 0 && "fill-current")} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-serif">Bookmarks</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                {bookmarkGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No bookmarks yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Tap verses to highlight, then save
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-2">
                    {bookmarkGroups.map((bookmark) => (
                      <Card key={bookmark.id} className="p-3 shadow-sm">
                        <p className="text-xs font-medium text-primary mb-2">
                          {bookmark.reference}
                        </p>
                        {bookmark.verses.map((v) => (
                          <p key={v.number} className="font-serif text-sm leading-relaxed text-foreground/90 mb-1">
                            <span className="text-muted-foreground text-xs mr-1">{v.number}</span>
                            {v.text}
                          </p>
                        ))}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                          <p className="text-xs text-muted-foreground">
                            {new Date(bookmark.dateSaved).toLocaleDateString()}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                const match = bookmark.reference.match(/(.+)\s+(\d+):(\d+)/);
                                if (match) {
                                  const [, bookName, chapter, verse] = match;
                                  navigate(`/bible?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`);
                                }
                                setBookmarksSheetOpen(false);
                              }}
                              data-testid={`button-view-bookmark-${bookmark.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary"
                              onClick={() => {
                                const combinedText = bookmark.verses.map(v => `${v.number}. ${v.text}`).join(" ");
                                navigate(`/chat?verse=${encodeURIComponent(bookmark.reference)}&text=${encodeURIComponent(combinedText)}`);
                                setBookmarksSheetOpen(false);
                              }}
                              data-testid={`button-reflect-bookmark-${bookmark.id}`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => {
                                setBookmarkGroups(bookmarkGroups.filter(b => b.id !== bookmark.id));
                              }}
                              data-testid={`button-remove-bookmark-${bookmark.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
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
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search by feeling or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pr-10"
                    data-testid="input-search"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={searchLoading}
                  size="icon"
                  variant="ghost"
                  className="text-primary"
                  data-testid="button-do-search"
                >
                  {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </Button>
              </div>
              {/* Feeling suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {["anxious", "fear", "hope", "peace", "strength", "comfort"].map((feeling) => (
                  <Button
                    key={feeling}
                    variant="outline"
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => {
                      setSearchQuery(feeling);
                    }}
                    data-testid={`button-feeling-${feeling}`}
                  >
                    {feeling}
                  </Button>
                ))}
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
            className="space-y-4"
          >
            {/* Grouped verses (max 4 lines) - plain view, no cards */}
            <div className="space-y-4">
              {groupShortVerses(verses).map((verseGroup, groupIndex) => (
                <div key={groupIndex} className="space-y-1" data-testid={`verse-group-${groupIndex}`}>
                  {verseGroup.map((verse) => {
                    const isHighlighted = highlightedVerses.has(verse.number);
                    return (
                      <motion.div 
                        key={verse.number}
                        className="flex gap-3 cursor-pointer py-1.5 transition-all relative"
                        onClick={() => handleVerseClick(verse.number)}
                        data-verse={verse.number}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className={cn(
                          "text-xs font-medium pt-0.5 w-6 text-right shrink-0 transition-colors",
                          isHighlighted ? "text-primary" : "text-muted-foreground"
                        )}>
                          {verse.number}
                        </span>
                        <span className="font-serif text-base leading-relaxed text-foreground/90 relative">
                          {verse.text}
                          {/* Dashed underline when highlighted */}
                          <motion.span 
                            className="absolute left-0 right-0 bottom-0 h-0.5 border-b-2 border-dashed border-primary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHighlighted ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Results - Verse Cards */}
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-sm text-muted-foreground text-center">
                {searchResults.length} verses found for "{searchQuery}"
              </p>
              {searchResults.slice(0, 5).map((result: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  <Card className="p-4 shadow-md border-0 bg-card">
                    <p className="font-serif text-base leading-relaxed text-foreground/90 mb-2">
                      {result.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {result.reference}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary gap-1.5"
                          onClick={() => {
                            const newBookmark: BookmarkGroup = {
                              id: `${result.reference}-${Date.now()}`,
                              verses: [{ number: "1", text: result.text }],
                              reference: result.reference,
                              dateSaved: new Date(),
                            };
                            setBookmarkGroups([...bookmarkGroups, newBookmark]);
                          }}
                          data-testid={`button-bookmark-search-${index}`}
                        >
                          <Bookmark className="w-4 h-4" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 gap-1.5"
                          onClick={() => {
                            navigate(`/chat?verse=${encodeURIComponent(result.reference)}&text=${encodeURIComponent(result.text)}`);
                          }}
                          data-testid={`button-reflect-search-${index}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Reflect
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Bar - appears when verses are highlighted */}
      <AnimatePresence>
        {highlightedVerses.size > 0 && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="max-w-md mx-auto">
              <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-2xl shadow-xl p-3 flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 gap-2 text-primary bg-primary/10 hover:bg-primary/20"
                  onClick={() => handleSaveHighlighted(verses)}
                  data-testid="button-bookmark-floating"
                >
                  <Bookmark className="w-5 h-5" />
                  Bookmark
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 gap-2 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                  onClick={() => handleReflectHighlighted(verses)}
                  data-testid="button-reflect-floating"
                >
                  <MessageCircle className="w-5 h-5" />
                  Reflect
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

