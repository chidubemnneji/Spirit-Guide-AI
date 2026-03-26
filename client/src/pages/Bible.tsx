import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch, useLocation } from "wouter";
import { useBible } from "@/context/BibleContext";
import { useScroll } from "@/context/ScrollContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Search, X, Bookmark, MessageCircle, Star, ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";
import { BIBLE_VERSE_PATTERN } from "@/lib/bibleUtils";

interface BookmarkGroup {
  id: string;
  verses: { number: string; text: string }[];
  reference: string;
  dateSaved: Date;
}

const VERSE_OF_THE_DAY = {
  text: "Be still, and know that I am God.",
  reference: "Psalm 46:10",
};

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
  const [targetVerse, setTargetVerse] = useState<string | null>(null);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(new Set());
  const [animateContent, setAnimateContent] = useState(false);
  const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkGroup[]>([]);
  const [bookmarksSheetOpen, setBookmarksSheetOpen] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const urlProcessedRef = useRef(false);
  const lastScrollY = useRef(0);
  const [, navigate] = useLocation();
  const { setHideNav } = useScroll();
  
  const searchString = useSearch();

  // Hide bottom nav when scrolling down in reader mode
  useEffect(() => {
    if (!showReader) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current && currentScrollY > 100;
      setHideNav(isScrollingDown);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      setHideNav(false);
    };
  }, [setHideNav, showReader]);

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
    setShowReader(true);
    
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeFeeling, setActiveFeeling] = useState<string | null>(null);

  const FEELINGS = [
    { id: "anxious", label: "Anxious" },
    { id: "sad", label: "Sad" },
    { id: "stressed", label: "Stressed" },
    { id: "hopeful", label: "Hopeful" },
    { id: "confused", label: "Confused" },
    { id: "joyful", label: "Joyful" },
  ];
  const [showAllResults, setShowAllResults] = useState(false);

  const parseReference = (reference: string): { book: string; chapter: string; verse: string } | null => {
    let cleanRef = reference
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s*-\s*[A-Z]+\s*$/, '')
      .trim();
    
    const match = cleanRef.match(/^(.+?)\s+(\d+):(\d+(?:-\d+)?)$/);
    if (match) {
      return { book: match[1].trim(), chapter: match[2], verse: match[3].split('-')[0] };
    }
    return null;
  };

  const navigateToVerse = (reference: string) => {
    const parsed = parseReference(reference);
    if (parsed) {
      setSearchResults([]);
      setShowAllResults(false);
      navigate(`/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&verse=${parsed.verse}`);
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && currentVersion) {
      setSearchLoading(true);
      setShowAllResults(false);
      setActiveFeeling(null);
      try {
        // Check if query contains a specific verse reference pattern using shared utility
        const versePattern = new RegExp(BIBLE_VERSE_PATTERN.source, 'i');
        const hasVerseReference = versePattern.test(searchQuery);

        // Only use feeling detection if NO verse reference is present
        if (!hasVerseReference) {
          const emotionKeywords: Record<string, string> = {
            anxious: "anxious",
            anxiety: "anxious",
            worried: "anxious",
            worry: "anxious",
            afraid: "anxious",
            fear: "anxious",
            scared: "anxious",
            sad: "sad",
            grief: "sad",
            mourning: "sad",
            crying: "sad",
            depressed: "sad",
            stressed: "stressed",
            overwhelmed: "stressed",
            tired: "stressed",
            exhausted: "stressed",
            hopeful: "hopeful",
            hope: "hopeful",
            encouraged: "hopeful",
            confused: "confused",
            lost: "confused",
            uncertain: "confused",
            joyful: "joyful",
            happy: "joyful",
            grateful: "joyful",
            thankful: "joyful",
          };

          const queryLower = searchQuery.toLowerCase();
          let detectedFeeling: string | null = null;
          for (const [keyword, feeling] of Object.entries(emotionKeywords)) {
            if (queryLower.includes(keyword)) {
              detectedFeeling = feeling;
              break;
            }
          }

          if (detectedFeeling) {
            // Use feeling-based scripture search
            const res = await fetch(`/api/scripture/feeling?feeling=${detectedFeeling}&count=5`);
            const data = await res.json();
            if (data.selected_scriptures) {
              setSearchResults(data.selected_scriptures.map((s: any) => ({
                reference: s.citation,
                text: s.text,
              })));
            } else {
              setSearchResults([]);
            }
            setSearchLoading(false);
            return;
          }
        }

        // Regular bible search (including when verse reference is detected)
        const res = await fetch(`/api/bible/${currentVersion.id}/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }
  }, [searchQuery, currentVersion]);

  const handleFeelingSelect = useCallback(async (feeling: string) => {
    if (activeFeeling === feeling) {
      setActiveFeeling(null);
      setSearchResults([]);
      return;
    }
    
    setActiveFeeling(feeling);
    setSearchLoading(true);
    setSearchQuery("");
    setShowAllResults(false);
    
    try {
      const res = await fetch(`/api/scripture/feeling?feeling=${feeling}&count=5`);
      const data = await res.json();
      if (data.selected_scriptures) {
        setSearchResults(data.selected_scriptures.map((s: any) => ({
          reference: s.citation,
          text: s.text,
        })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Feeling search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [activeFeeling]);

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
              .then((ch) => {
                setCurrentChapter(ch);
                setShowReader(true);
              });
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
    const newHighlighted = new Set(highlightedVerses);
    if (newHighlighted.has(verseNum)) {
      newHighlighted.delete(verseNum);
    } else {
      newHighlighted.add(verseNum);
    }
    setHighlightedVerses(newHighlighted);
  };

  const handleSaveHighlighted = async (verses: { number: string; text: string }[]) => {
    if (highlightedVerses.size === 0 || !currentChapter) return;

    const selectedVerses = verses.filter(v => highlightedVerses.has(v.number));
    if (selectedVerses.length === 0) return;

    const sortedVerses = selectedVerses.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const firstVerse = sortedVerses[0].number;
    const lastVerse = sortedVerses[sortedVerses.length - 1].number;
    const reference = firstVerse === lastVerse
      ? `${currentChapter.reference}:${firstVerse}`
      : `${currentChapter.reference}:${firstVerse}-${lastVerse}`;
    const verseText = sortedVerses.map(v => v.text).join(" ");

    // Also keep local bookmark state for the session
    const newBookmark: BookmarkGroup = {
      id: `${reference}-${Date.now()}`,
      verses: sortedVerses,
      reference,
      dateSaved: new Date(),
    };
    setBookmarkGroups([...bookmarkGroups, newBookmark]);
    setHighlightedVerses(new Set());

    // Save to prayer journal
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: `Saved from Bible reading:\n\n"${verseText}"`,
          verseReference: reference,
          verseText,
        }),
      });
    } catch (e) {
      console.error("Failed to save verse to journal:", e);
    }
  };

  const handleReflectHighlighted = async (verses: { number: string; text: string }[]) => {
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
    
    // Create a fresh conversation for this reflection
    try {
      localStorage.removeItem("soulguide_conversation_id");
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Reflecting on ${reference}` }),
        credentials: "include",
      });
      if (res.ok) {
        const conv = await res.json();
        localStorage.setItem("soulguide_conversation_id", String(conv.id));
      }
    } catch (e) {
      console.error("Failed to create reflection conversation:", e);
    }

    setHighlightedVerses(new Set());
    navigate(`/chat?verse=${encodeURIComponent(reference)}&text=${encodeURIComponent(combinedText)}`);
  };

  const oldTestamentBooks = books.filter((b) => b.testament === "OT");
  const newTestamentBooks = books.filter((b) => b.testament === "NT");

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

  // Bible Home View
  if (!showReader) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-5 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-10 h-10 text-primary mb-4" />
          </motion.div>
          
          <motion.h1 
            className="font-serif text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            data-testid="text-bible-title"
          >
            The Living Word
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Every answer you need is already written. Let me help you find it.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          className="px-5 py-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask me anything about the Bible..."
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
          
          {/* Feeling chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {FEELINGS.map((feeling) => (
              <Button
                key={feeling.id}
                variant={activeFeeling === feeling.id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => handleFeelingSelect(feeling.id)}
                data-testid={`button-feeling-${feeling.id}`}
              >
                {feeling.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              className="px-5 py-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(showAllResults ? searchResults : searchResults.slice(0, 5)).map((result: any, index: number) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer hover-elevate"
                    onClick={() => navigateToVerse(result.reference)}
                  >
                    <p className="text-xs font-medium text-primary">{result.reference}</p>
                    <p className="text-sm text-foreground/80 line-clamp-2 mt-1">{result.text}</p>
                  </Card>
                ))}
                {searchResults.length > 5 && !showAllResults && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
                    onClick={() => setShowAllResults(true)}
                  >
                    Show {searchResults.length - 5} more results
                  </Button>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                Clear results
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards Section */}
        <div className="px-5 py-4 space-y-4">
          {/* Full Bible Reader Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover-elevate"
              onClick={() => setBookSheetOpen(true)}
              data-testid="card-bible-reader"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {currentVersion?.abbreviation || "NIV"} Version
                    </span>
                    <h3 className="font-semibold text-xl mt-1">Full Bible Reader</h3>
                    <p className="text-muted-foreground mt-1">
                      Read scripture in your preferred translation
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Your Verse Collection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover-elevate"
              onClick={() => setBookmarksSheetOpen(true)}
              data-testid="card-verse-collection"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {bookmarkGroups.length} Verses Saved
                    </span>
                    <h3 className="font-semibold text-xl mt-1">Your Verse Collection</h3>
                    <p className="text-muted-foreground mt-1">
                      Verses you've bookmarked and memorized
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Verse of the Day Widget */}
        <motion.div 
          className="px-5 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Personalized Widget Preview
              </span>
              <p className="font-serif text-xl mt-3 text-foreground">
                "{VERSE_OF_THE_DAY.text}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">{VERSE_OF_THE_DAY.reference}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Book Selection Sheet */}
        <Sheet open={bookSheetOpen} onOpenChange={setBookSheetOpen}>
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

        {/* Bookmarks Sheet */}
        <Sheet open={bookmarksSheetOpen} onOpenChange={setBookmarksSheetOpen}>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif">Your Collection</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] mt-4">
              {bookmarkGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No verses saved yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tap verses while reading to save them
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {bookmarkGroups.map((bookmark) => (
                    <Card 
                      key={bookmark.id} 
                      className="p-3 shadow-sm cursor-pointer hover-elevate"
                      onClick={() => {
                        const match = bookmark.reference.match(/(.+)\s+(\d+):(\d+)/);
                        if (match) {
                          const [, bookName, chapter, verse] = match;
                          navigate(`/bible?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`);
                        }
                        setBookmarksSheetOpen(false);
                      }}
                      data-testid={`card-bookmark-${bookmark.id}`}
                    >
                      <p className="text-xs font-medium text-primary mb-2">
                        {bookmark.reference}
                      </p>
                      <div className="line-clamp-4">
                        {bookmark.verses.map((v) => (
                          <p key={v.number} className="font-serif text-sm leading-relaxed text-foreground/90">
                            <span className="text-muted-foreground text-xs mr-1">{v.number}</span>
                            {v.text}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                          {new Date(bookmark.dateSaved).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            onClick={(e) => {
                              e.stopPropagation();
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
    );
  }

  // Bible Reader View
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReader(false)}
            data-testid="button-back-to-bible-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center flex-1">
            <p className="font-serif text-lg font-semibold">{currentChapter?.reference || "Select Chapter"}</p>
            {currentVersion && (
              <p className="text-xs text-muted-foreground">{currentVersion.name}</p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBookmarksSheetOpen(true)}
            data-testid="button-open-bookmarks"
          >
            <Bookmark className={cn("w-5 h-5", bookmarkGroups.length > 0 && "fill-current text-primary")} />
          </Button>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-2">
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

            <Sheet open={chapterSheetOpen} onOpenChange={setChapterSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!currentBook}
                  data-testid="button-select-chapter"
                >
                  Ch. {currentChapter?.number || "-"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[50vh]">
                <SheetHeader>
                  <SheetTitle className="font-serif">Select Chapter</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-5 gap-2 mt-4 max-h-[35vh] overflow-y-auto p-2">
                  {chapters.map((ch) => (
                    <Button
                      key={ch.id}
                      variant={currentChapter?.id === ch.id ? "default" : "outline"}
                      onClick={() => handleSelectChapter(ch.id)}
                      data-testid={`chapter-${ch.number}`}
                    >
                      {ch.number}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
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
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {!currentChapter && !chapterLoading && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-3">Select a Book</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Choose a book to begin reading
            </p>
            <Button 
              onClick={() => setBookSheetOpen(true)} 
              className="rounded-xl"
              data-testid="button-browse-books"
            >
              Browse Books
            </Button>
          </motion.div>
        )}

        {chapterLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {currentChapter && verses.length > 0 && (
          <>
            {/* Action bar for highlighted verses - fixed at bottom */}
            <AnimatePresence>
              {highlightedVerses.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-20 left-4 right-4 z-30"
                >
                  <Card className="p-2 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground px-2">
                        {highlightedVerses.size} verse{highlightedVerses.size > 1 ? "s" : ""} selected
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveHighlighted(verses)}
                          data-testid="button-save-verses"
                        >
                          <Bookmark className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReflectHighlighted(verses)}
                          data-testid="button-reflect-verses"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Reflect
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const selectedVerses = verses.filter(v => highlightedVerses.has(v.number));
                            if (selectedVerses.length === 0 || !currentChapter) return;
                            const sorted = selectedVerses.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                            const first = sorted[0].number;
                            const last = sorted[sorted.length - 1].number;
                            const ref = first === last
                              ? `${currentChapter.reference}:${first}`
                              : `${currentChapter.reference}:${first}-${last}`;
                            const text = sorted.map(v => v.text).join(" ");
                            const shareText = `"${text}" — ${ref}`;
                            if (navigator.share) {
                              navigator.share({ text: shareText });
                            } else {
                              navigator.clipboard.writeText(shareText);
                            }
                          }}
                          data-testid="button-share-verses"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHighlightedVerses(new Set())}
                          data-testid="button-clear-selection"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: animateContent ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-1"
            >
              {verses.map((verse, index) => (
                <motion.p
                  key={verse.number}
                  data-verse={verse.number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleVerseClick(verse.number)}
                  className={cn(
                    "font-serif text-lg leading-relaxed py-1 px-2 -mx-2 rounded-lg cursor-pointer transition-colors",
                    highlightedVerses.has(verse.number) && "bg-primary/20"
                  )}
                >
                  <span className="text-primary font-bold text-sm mr-2">{verse.number}</span>
                  {verse.text}
                </motion.p>
              ))}
            </motion.div>
          </>
        )}
      </main>

      {/* Bookmarks Sheet */}
      <Sheet open={bookmarksSheetOpen} onOpenChange={setBookmarksSheetOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="font-serif">Your Collection</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            {bookmarkGroups.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No verses saved yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Tap verses to highlight, then save
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {bookmarkGroups.map((bookmark) => (
                  <Card 
                    key={bookmark.id} 
                    className="p-3 shadow-sm cursor-pointer hover-elevate"
                    onClick={() => {
                      const match = bookmark.reference.match(/(.+)\s+(\d+):(\d+)/);
                      if (match) {
                        const [, bookName, chapter, verse] = match;
                        navigate(`/bible?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`);
                      }
                      setBookmarksSheetOpen(false);
                    }}
                    data-testid={`card-bookmark-${bookmark.id}`}
                  >
                    <p className="text-xs font-medium text-primary mb-2">
                      {bookmark.reference}
                    </p>
                    <div className="line-clamp-4">
                      {bookmark.verses.map((v) => (
                        <p key={v.number} className="font-serif text-sm leading-relaxed text-foreground/90">
                          <span className="text-muted-foreground text-xs mr-1">{v.number}</span>
                          {v.text}
                        </p>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
