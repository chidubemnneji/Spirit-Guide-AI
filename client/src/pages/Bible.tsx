import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch, useLocation } from "wouter";
import { useBible } from "@/context/BibleContext";
import { useScroll } from "@/context/ScrollContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight, BookOpen, Search, X, Bookmark, MessageCircle, Star, ArrowLeft, Share2, Columns2, ImageDown, Brain } from "lucide-react";
import { shareVerseImage } from "@/lib/verseImage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BibleVersion, Book, Chapter } from "@shared/bible.types";
import { BIBLE_VERSE_PATTERN, normalizeBookName } from "@/lib/bibleUtils";

interface BookmarkGroup {
  id: number;
  verses: { number: string; text: string }[];
  reference: string;
  dateSaved: Date | string;
}

const VERSE_OF_THE_DAY = {
  text: "Be still, and know that I am God.",
  reference: "Psalm 46:10",
};

function TodaysVerseCard({ onNavigate }: { onNavigate: (ref: string) => void }) {
  const { data } = useQuery<{ success: boolean; data: { scriptureText?: string; scriptureReference?: string } }>({
    queryKey: ["/api/devotional/today"],
    staleTime: 1000 * 60 * 10,
  });
  const [sharingImage, setSharingImage] = useState(false);

  const text = data?.data?.scriptureText || VERSE_OF_THE_DAY.text;
  const reference = data?.data?.scriptureReference || VERSE_OF_THE_DAY.reference;

  const handleShareImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharingImage) return;
    setSharingImage(true);
    try {
      await shareVerseImage(text, reference);
    } catch (err) {
      console.error("Verse image share failed:", err);
    } finally {
      setSharingImage(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-6 py-7 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] cursor-pointer"
        onClick={() => onNavigate(reference)}
        onKeyDown={(e) => { if (e.key === "Enter") onNavigate(reference); }}
        data-testid="card-verse-of-the-day"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--app-green)" }} />
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--app-green)" }}>
              Verse of the Day
            </span>
          </div>
          <button
            onClick={handleShareImage}
            disabled={sharingImage}
            className="p-1 disabled:opacity-40"
            style={{ color: "var(--app-gray-lt)" }}
            aria-label="Share as image"
            title="Share as image"
            data-testid="button-share-verse-of-day-image"
          >
            {sharingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
          </button>
        </div>
        <p className="font-serif leading-relaxed italic text-[var(--app-dark)]" style={{ fontSize: "calc(19px * var(--reading-scale, 1))" }}>
          "{text}"
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[13px] font-semibold tracking-wide" style={{ color: "var(--app-green)" }}>{reference}</p>
          <span className="text-[11px] text-[var(--app-gray-lt)]">Read in context →</span>
        </div>
      </div>
    </motion.div>
  );
}

interface MemorizationCardData {
  id: number;
  reference: string;
  verseText: string;
  dueDate: string;
}

const GRADE_BUTTONS: { grade: "again" | "hard" | "good" | "easy"; label: string; color: string }[] = [
  { grade: "again", label: "Again", color: "var(--app-danger)" },
  { grade: "hard", label: "Hard", color: "var(--app-amber)" },
  { grade: "good", label: "Good", color: "var(--app-green)" },
  { grade: "easy", label: "Easy", color: "var(--app-green)" },
];

// A spaced-repetition flashcard review flow — cards are seeded from the
// user's saved verse collection (see handleAddToMemorization) and scheduled
// server-side with a standard SM-2 algorithm.
function MemorizeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const { data, refetch } = useQuery<{ cards: MemorizationCardData[]; dueCards: MemorizationCardData[] }>({
    queryKey: ["/api/memorization/cards"],
    enabled: open,
  });

  const dueCards = data?.dueCards || [];
  const current = dueCards[0];

  const handleGrade = async (grade: "again" | "hard" | "good" | "easy") => {
    if (!current || reviewing) return;
    setReviewing(true);
    try {
      await fetch(`/api/memorization/cards/${current.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ grade }),
      });
      setRevealed(false);
      await refetch();
    } finally {
      setReviewing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>Memorize</SheetTitle>
        </SheetHeader>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {!data ? (
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--app-green)" }} />
          ) : !current ? (
            <div className="text-center">
              <Brain className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--app-border)" }} />
              <p className="font-serif text-[22px] text-[var(--app-dark)] mb-2">
                {data.cards.length === 0 ? "No verses to memorize yet." : "All caught up!"}
              </p>
              <p className="text-[14px] text-[var(--app-gray-lt)]">
                {data.cards.length === 0
                  ? "Save a verse in your collection, then tap the brain icon to add it here."
                  : `You have ${data.cards.length} verse${data.cards.length === 1 ? "" : "s"} in rotation — come back when the next one is due.`}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md text-center">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-6" style={{ color: "var(--app-gray-lt)" }}>
                {dueCards.length} due today
              </p>
              <p className="text-[13px] font-semibold tracking-wide mb-4" style={{ color: "var(--app-green)" }}>{current.reference}</p>
              {revealed ? (
                <p className="font-serif leading-relaxed text-[var(--app-dark)] mb-8" style={{ fontSize: "calc(22px * var(--reading-scale, 1))" }}>"{current.verseText}"</p>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-16 border border-dashed mb-8"
                  style={{ borderColor: "var(--app-border)", color: "var(--app-gray-lt)" }}
                >
                  Tap to reveal
                </button>
              )}
              {revealed && (
                <div className="grid grid-cols-4 gap-2">
                  {GRADE_BUTTONS.map((b) => (
                    <button
                      key={b.grade}
                      onClick={() => handleGrade(b.grade)}
                      disabled={reviewing}
                      className="py-3 text-[12px] font-semibold uppercase tracking-wide border disabled:opacity-40"
                      style={{ borderColor: b.color, color: b.color }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
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
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetVerse, setTargetVerse] = useState<string | null>(null);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(new Set());
  const [animateContent, setAnimateContent] = useState(false);
  const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkGroup[]>([]);
  const [bookmarksSheetOpen, setBookmarksSheetOpen] = useState(false);
  const [memorizeSheetOpen, setMemorizeSheetOpen] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { toast } = useToast();
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

  // Fetch the same chapter in a second translation for side-by-side compare.
  // Chapter ids (e.g. "GEN.1") are shared across versions on api.bible, so
  // the current chapter's id works unchanged against a different bibleId.
  const { data: compareChapterContent, isLoading: compareLoading } = useQuery<Chapter>({
    queryKey: ["/api/bible", compareVersionId, "chapters", currentChapter?.id],
    enabled: compareOpen && !!compareVersionId && !!currentChapter?.id,
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

  // Load previously saved verses — these used to live only in local state
  // and vanished on refresh; now they're persisted server-side.
  useEffect(() => {
    fetch("/api/bible/saved", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.bookmarks) setBookmarkGroups(d.bookmarks); })
      .catch(() => {});
  }, []);

  // Default the compare-panel's second version to whichever isn't the one
  // already being read.
  useEffect(() => {
    if (versions.length > 0 && (!compareVersionId || compareVersionId === currentVersion?.id)) {
      const alt = versions.find((v) => v.id !== currentVersion?.id);
      if (alt) setCompareVersionId(alt.id);
    }
  }, [versions, currentVersion, compareVersionId]);

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

  // If URL has book param, always show reader immediately (don't wait for books to load)
  useEffect(() => {
    if (!searchString) return;
    const params = new URLSearchParams(searchString);
    if (params.get("book")) {
      setShowReader(true);
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

    // Match loosely: the third-party Bible API's book.name doesn't always
    // agree, letter-for-letter, with the canonical name buildBibleLink()
    // put in the URL (singular/plural, punctuation, "nameLong" vs "name"),
    // and an exact-match miss here was silently dropping the deep link —
    // landing on the reader with no book selected instead of the verse.
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = normalize(bookParam);
    const targetBook = books.find((b) => {
      const name = normalize(b.name);
      const nameLong = b.nameLong ? normalize(b.nameLong) : "";
      return (
        name === targetNorm ||
        nameLong === targetNorm ||
        name === targetNorm.replace(/s$/, "") ||
        `${name}s` === targetNorm ||
        nameLong.includes(targetNorm)
      );
    });

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
  const [searchError, setSearchError] = useState<string | null>(null);
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
      // Normalize the book name the same way buildBibleLink() does elsewhere,
      // so "Psalm 46:10" (singular, as most references read) resolves the
      // same way whether it came from search, the chat, or here.
      return { book: normalizeBookName(match[1].trim()), chapter: match[2], verse: match[3].split('-')[0] };
    }
    return null;
  };

  const navigateToVerse = (reference: string) => {
    const parsed = parseReference(reference);
    if (parsed) {
      setSearchResults([]);
      setShowAllResults(false);
      setSearchSheetOpen(false);
      navigate(`/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&verse=${parsed.verse}`);
      setShowReader(true);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setShowAllResults(false);
    setActiveFeeling(null);
    setSearchError(null);
    try {
      const versePattern = new RegExp(BIBLE_VERSE_PATTERN.source, 'i');
      const hasVerseReference = versePattern.test(searchQuery);

      if (hasVerseReference && currentVersion) {
        // Direct Bible API lookup for specific references
        const res = await fetch(`/api/bible/${currentVersion.id}/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data || []);
      } else {
        // AI-powered search for natural language queries (also fallback when no version loaded)
        const res = await fetch("/api/bible/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery, versionId: currentVersion?.id }),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        if (data.results?.length) {
          setSearchResults(data.results.map((r: any) => ({
            reference: r.reference,
            text: r.text,
            relevance: r.relevance,
          })));
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
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
      // Use AI search for feeling-based queries too
      const res = await fetch("/api/bible/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `verses about feeling ${feeling}`, versionId: currentVersion?.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.map((r: any) => ({
          reference: r.reference,
          text: r.text,
          relevance: r.relevance,
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
    setHighlightedVerses(new Set());

    // Persist to the saved-verses collection (backs both this reader's
    // bookmarks sheet and the Account page's "Saved Passages").
    try {
      const res = await fetch("/api/bible/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reference, verses: sortedVerses }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.bookmark) {
          setBookmarkGroups(prev => [d.bookmark, ...prev.filter(b => b.reference !== reference)]);
        }
      }
    } catch (e) {
      console.error("Failed to save verse:", e);
    }

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

  const handleDeleteBookmark = async (id: number) => {
    setBookmarkGroups(prev => prev.filter(b => b.id !== id));
    try {
      await fetch(`/api/bible/saved/${id}`, { method: "DELETE", credentials: "include" });
    } catch (e) {
      console.error("Failed to delete saved verse:", e);
    }
  };

  const handleAddToMemorization = async (bookmark: BookmarkGroup) => {
    const verseText = bookmark.verses.map(v => v.text).join(" ");
    try {
      const res = await fetch("/api/memorization/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reference: bookmark.reference, verseText }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.alreadyExists) {
          toast({ title: "Already memorizing this verse" });
        } else {
          toast({ title: "Added to memorization", description: bookmark.reference });
        }
      }
    } catch (e) {
      console.error("Failed to add to memorization:", e);
    }
  };

  const handleShareVerseImage = async (verses: { number: string; text: string }[]) => {
    if (highlightedVerses.size === 0 || !currentChapter || generatingImage) return;
    const selectedVerses = verses.filter(v => highlightedVerses.has(v.number));
    if (selectedVerses.length === 0) return;

    const sorted = selectedVerses.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const first = sorted[0].number;
    const last = sorted[sorted.length - 1].number;
    const ref = first === last ? `${currentChapter.reference}:${first}` : `${currentChapter.reference}:${first}-${last}`;
    const text = sorted.map(v => v.text).join(" ");

    setGeneratingImage(true);
    try {
      await shareVerseImage(text, ref);
    } catch (err) {
      console.error("Verse image share failed:", err);
    } finally {
      setGeneratingImage(false);
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
      <div className="min-h-screen flex items-center justify-center pb-20" style={{ background: "var(--app-bg)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--app-green)" }} />
      </div>
    );
  }

  const verses = currentChapter ? parseVerses(currentChapter.content) : [];

  // Bible Home View
  if (!showReader) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
        {/* Bible is a wide page on desktop (for the reader below); the browse
            list itself stays a readable centered column rather than stretching
            edge-to-edge. */}
        <div className="md:max-w-2xl md:mx-auto md:pt-6">
        <div className="px-5 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-10 h-10 mb-4" style={{ color: "var(--app-green)" }} />
          </motion.div>
          
          <motion.h1 
            className="font-serif text-3xl font-bold text-[var(--app-dark)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            data-testid="text-bible-title"
          >
            The Living Word
          </motion.h1>
          
          <motion.p 
            className="mt-2"
            style={{ color: "var(--app-gray-lt)" }}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-gray-lt)]" />
              <input
                placeholder="Search verses or type a reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] focus:border-[var(--app-green)] outline-none text-[14px] font-sans text-[var(--app-dark)] transition-colors"
                data-testid="input-search"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-4 py-2.5 font-semibold text-[12px] tracking-wider uppercase disabled:opacity-40"
              style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
              data-testid="button-do-search"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
            </button>
          </div>
          
          {/* Feeling chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {FEELINGS.map((feeling) => (
              <button
                key={feeling.id}
                onClick={() => handleFeelingSelect(feeling.id)}
                data-testid={`button-feeling-${feeling.id}`}
                className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors"
                style={{
                  background: activeFeeling === feeling.id ? "var(--cta-bg)" : "transparent",
                  color: activeFeeling === feeling.id ? "var(--cta-fg)" : "var(--app-gray-lt)",
                  border: activeFeeling === feeling.id ? "1px solid var(--app-green)" : "1px solid var(--app-border)",
                }}
              >
                {feeling.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search error */}
        {searchError && !searchLoading && (
          <div className="px-6 py-3 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <p className="text-[13px] text-red-600">{searchError}</p>
          </div>
        )}

        {/* Loading state */}
        {searchLoading && (
          <div className="flex items-center gap-2 px-6 py-4 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--app-green)]" />
            <span className="text-[13px] text-[var(--app-gray-lt)]">Finding verses...</span>
          </div>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="section-band">
                <span>Results</span>
                <button
                  className="text-[11px] font-medium tracking-wider uppercase text-[var(--app-gray-lt)]"
                  onClick={() => { setSearchResults([]); setSearchQuery(""); setActiveFeeling(null); }}
                >
                  Clear
                </button>
              </div>
              <div>
                {(showAllResults ? searchResults : searchResults.slice(0, 5)).map((result: any, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] block"
                    onClick={() => navigateToVerse(result.reference)}
                  >
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--app-green)] mb-1.5">{result.reference}</p>
                    {result.text && (
                      <p className="font-serif text-[17px] text-[var(--app-dark)] leading-relaxed">{result.text}</p>
                    )}
                    {result.relevance && (
                      <p className="text-[12px] text-[var(--app-gray-lt)] mt-2 italic">{result.relevance}</p>
                    )}
                  </button>
                ))}
                {searchResults.length > 5 && !showAllResults && (
                  <button
                    className="w-full py-4 text-[11px] font-semibold tracking-wider uppercase text-[var(--app-green)] bg-[var(--app-white)] border-b border-[var(--app-border-soft)]"
                    onClick={() => setShowAllResults(true)}
                  >
                    Show {searchResults.length - 5} more results
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards Section */}
        <div className="px-5 py-4 space-y-4">
          {/* Full Bible Reader Card */}
          <button
            onClick={() => setBookSheetOpen(true)}
            className="w-full text-left px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between"
            data-testid="card-bible-reader"
          >
            <div>
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] block mb-1">{currentVersion?.abbreviation || "NIV"} Version</span>
              <p className="font-serif text-[22px] text-[var(--app-dark)] mb-1">Full Bible Reader</p>
              <p className="text-[14px] text-[var(--app-gray-lt)]">Read scripture in your preferred translation</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5" strokeLinecap="square"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <button
            onClick={() => setBookmarksSheetOpen(true)}
            className="w-full text-left px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between"
            data-testid="card-verse-collection"
          >
            <div>
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] block mb-1">{bookmarkGroups.length} Verses Saved</span>
              <p className="font-serif text-[22px] text-[var(--app-dark)] mb-1">Your Verse Collection</p>
              <p className="text-[14px] text-[var(--app-gray-lt)]">Verses you've bookmarked and highlighted</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5" strokeLinecap="square"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <button
            onClick={() => setMemorizeSheetOpen(true)}
            className="w-full text-left px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between"
            data-testid="card-memorize"
          >
            <div>
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] block mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Spaced Repetition
              </span>
              <p className="font-serif text-[22px] text-[var(--app-dark)] mb-1">Memorize</p>
              <p className="text-[14px] text-[var(--app-gray-lt)]">Review your saved verses until they're second nature</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5" strokeLinecap="square"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* Verse of the Day — live from today's devotional */}
        <TodaysVerseCard onNavigate={navigateToVerse} />

        {/* Book Selection Sheet */}
        <Sheet open={bookSheetOpen} onOpenChange={setBookSheetOpen}>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif">Select Book</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)] mt-4">
              {booksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--app-green)" }} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--app-gray-lt)" }}>
                      Old Testament
                    </h3>
                    <div>
                      {oldTestamentBooks.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSelectBook(book)}
                          data-testid={`book-${book.abbreviation}`}
                          className="w-full text-left px-2 py-2 font-serif text-[16px] transition-colors"
                          style={{
                            color: currentBook?.id === book.id ? "var(--app-green)" : "var(--app-dark)",
                            fontWeight: currentBook?.id === book.id ? 700 : 400,
                            background: currentBook?.id === book.id ? "var(--app-bg-warm)" : "transparent",
                          }}
                        >
                          {book.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--app-gray-lt)" }}>
                      New Testament
                    </h3>
                    <div>
                      {newTestamentBooks.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSelectBook(book)}
                          data-testid={`book-${book.abbreviation}`}
                          className="w-full text-left px-2 py-2 font-serif text-[16px] transition-colors"
                          style={{
                            color: currentBook?.id === book.id ? "var(--app-green)" : "var(--app-dark)",
                            fontWeight: currentBook?.id === book.id ? 700 : 400,
                            background: currentBook?.id === book.id ? "var(--app-bg-warm)" : "transparent",
                          }}
                        >
                          {book.name}
                        </button>
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
              <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>Your Collection</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] mt-4">
              {bookmarkGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--app-border)" }} />
                  <p className="text-[14px]" style={{ color: "var(--app-gray-lt)" }}>No verses saved yet</p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--app-gray-lt)" }}>
                    Tap verses while reading to save them
                  </p>
                </div>
              ) : (
                <div>
                  {bookmarkGroups.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="cursor-pointer py-4 border-b border-[var(--app-border-soft)]"
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
                      <p className="text-[11px] font-semibold tracking-wide mb-2" style={{ color: "var(--app-green)" }}>
                        {bookmark.reference}
                      </p>
                      <div className="line-clamp-4">
                        {bookmark.verses.map((v) => (
                          <p key={v.number} className="font-serif text-[14px] leading-relaxed text-[var(--app-dark)]">
                            <span className="text-[11px] mr-1" style={{ color: "var(--app-gray-lt)" }}>{v.number}</span>
                            {v.text}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--app-border-soft)" }}>
                        <p className="text-[11px]" style={{ color: "var(--app-gray-lt)" }}>
                          {new Date(bookmark.dateSaved).toLocaleDateString()}
                        </p>
                        <div className="flex gap-3">
                          <button
                            className="p-1"
                            style={{ color: "var(--app-green)" }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const combinedText = bookmark.verses.map(v => `${v.number}. ${v.text}`).join(" ");
                              // Create fresh conversation for this reflection
                              try {
                                localStorage.removeItem("soulguide_conversation_id");
                                const res = await fetch("/api/conversations", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ title: `Reflecting on ${bookmark.reference}` }),
                                });
                                if (res.ok) {
                                  const conv = await res.json();
                                  localStorage.setItem("soulguide_conversation_id", String(conv.id));
                                }
                              } catch {}
                              navigate(`/chat?verse=${encodeURIComponent(bookmark.reference)}&text=${encodeURIComponent(combinedText)}`);
                              setBookmarksSheetOpen(false);
                            }}
                            data-testid={`button-reflect-bookmark-${bookmark.id}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1"
                            style={{ color: "var(--app-green)" }}
                            onClick={(e) => { e.stopPropagation(); handleAddToMemorization(bookmark); }}
                            data-testid={`button-memorize-bookmark-${bookmark.id}`}
                            title="Add to memorization"
                          >
                            <Brain className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBookmark(bookmark.id);
                            }}
                            data-testid={`button-remove-bookmark-${bookmark.id}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <MemorizeSheet open={memorizeSheetOpen} onClose={() => setMemorizeSheetOpen(false)} />
        </div>
      </div>
    );
  }

  // Bible Reader View — a three-column desktop layout (book rail / reading
  // column / study rail) built as a plain flex row that lives inside the
  // width the app shell already gives this (now-wide) route. The side rails
  // use sticky (not fixed) positioning so they stay correctly aligned with
  // the row they belong to instead of being pinned to raw viewport edges.
  return (
    <div className="min-h-screen pb-20 md:flex md:items-start" style={{ background: "var(--app-bg)" }}>
      {/* Desktop left book-rail (matches comp) */}
      <aside className="hidden md:flex flex-col md:sticky md:top-0 md:h-screen md:w-[280px] md:shrink-0 border-r border-[var(--app-dark)] bg-[var(--app-bg)] overflow-y-auto">
        <div className="px-6 pt-8 pb-5 border-b border-[var(--app-border)]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setShowReader(false), handleSearch())}
            placeholder="Search scripture…"
            className="w-full bg-transparent border-b border-[var(--app-border)] focus:border-[var(--app-green)] outline-none pb-2 text-[15px] text-[var(--app-dark)] placeholder:text-[var(--app-gray-lt)]"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => handleSelectBook(book)}
              className={cn(
                "w-full flex items-center justify-between px-6 py-2.5 text-left transition-colors hover:bg-white/50",
                currentBook?.id === book.id ? "font-bold text-[var(--app-dark)]" : "text-[var(--app-gray)]"
              )}
            >
              <span className="text-[16px] flex items-center gap-2">
                {currentBook?.id === book.id && <span className="text-[10px]">▸</span>}
                {book.name}
              </span>
              <span className="text-[12px] text-[var(--app-gray-lt)]">{book.chaptersCount ?? ""}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-6 border-t border-[var(--app-border)] text-[13px] text-[var(--app-gray-lt)] space-y-1">
          <p>SoulGuide</p>
          <p className="text-[var(--app-gray-lt)]">{currentVersion?.abbreviation || "Scripture"}</p>
        </div>
      </aside>

      <div className="md:flex-1 md:min-w-0">
      <header className="sticky top-0 z-40 bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="flex items-center">
          <button
            onClick={() => setShowReader(false)}
            className="py-5 px-5 border-r border-[var(--app-border)] text-[var(--app-gray-lt)]"
            data-testid="button-back-to-bible-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 py-5 px-5">
            <p className="font-serif text-[20px] leading-none text-[var(--app-dark)]">{currentChapter?.reference || "Select Chapter"}</p>
            {currentVersion && <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--app-gray-lt)] mt-0.5">{currentVersion.name}</p>}
          </div>
          <button
            onClick={() => setCompareOpen(true)}
            disabled={!currentChapter || versions.length < 2}
            className="py-5 px-5 border-l border-[var(--app-border)] text-[var(--app-gray-lt)] disabled:opacity-30"
            data-testid="button-compare-translations"
            title="Compare translations"
          >
            <Columns2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setBookmarksSheetOpen(true)}
            className="py-5 px-5 border-l border-[var(--app-border)] text-[11px] font-semibold tracking-wider uppercase text-[var(--app-gray-lt)]"
            data-testid="button-open-bookmarks"
          >
            Saved
          </button>
        </div>

        {/* Compare translations */}
        <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
            <SheetHeader className="px-6 pt-6 pb-2">
              <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>
                Compare Translations — {currentChapter?.reference}
              </SheetTitle>
            </SheetHeader>
            <div className="px-6 py-3 border-b border-[var(--app-border)] flex items-center gap-2 flex-wrap">
              {versions.filter((v) => v.id !== currentVersion?.id).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCompareVersionId(v.id)}
                  className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider border transition-colors"
                  style={{
                    borderColor: compareVersionId === v.id ? "var(--app-green)" : "var(--app-border)",
                    color: compareVersionId === v.id ? "var(--app-green)" : "var(--app-gray-lt)",
                    background: compareVersionId === v.id ? "var(--app-bg-warm)" : "transparent",
                  }}
                >
                  {v.abbreviation}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-[var(--app-border)]">
              <div className="overflow-y-auto px-5 py-5">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] mb-3">{currentVersion?.abbreviation}</p>
                {verses.map((verse) => (
                  <p key={verse.number} className="font-serif text-[16px] leading-relaxed text-[var(--app-dark)] mb-2">
                    <sup className="text-[10px] font-sans font-bold mr-1" style={{ color: "var(--app-green)" }}>{verse.number}</sup>
                    {verse.text}
                  </p>
                ))}
              </div>
              <div className="overflow-y-auto px-5 py-5">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] mb-3">
                  {versions.find((v) => v.id === compareVersionId)?.abbreviation || "Select a translation"}
                </p>
                {compareLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--app-green)" }} /></div>
                ) : (
                  parseVerses(compareChapterContent?.content || "").map((verse) => (
                    <p key={verse.number} className="font-serif text-[16px] leading-relaxed text-[var(--app-dark)] mb-2">
                      <sup className="text-[10px] font-sans font-bold mr-1" style={{ color: "var(--app-green)" }}>{verse.number}</sup>
                      {verse.text}
                    </p>
                  ))
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={handlePrevChapter}
            disabled={!currentChapter?.previous}
            className="p-2 disabled:opacity-30 transition-opacity"
            style={{ color: "var(--app-green)" }}
            data-testid="button-prev-chapter"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <Sheet open={bookSheetOpen} onOpenChange={setBookSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="px-4 py-1.5 text-[13px] font-semibold"
                  style={{ border: "1px solid var(--app-border)", color: "var(--app-dark)" }}
                  data-testid="button-select-book"
                >
                  {currentBook?.name || "Select Book"}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>Select Book</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] mt-4">
                  {booksLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--app-green)" }} />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--app-gray-lt)" }}>
                          Old Testament
                        </h3>
                        <div>
                          {oldTestamentBooks.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => handleSelectBook(book)}
                              data-testid={`book-${book.abbreviation}`}
                              className="w-full text-left px-2 py-2 font-serif text-[16px] transition-colors"
                              style={{
                                color: currentBook?.id === book.id ? "var(--app-green)" : "var(--app-dark)",
                                fontWeight: currentBook?.id === book.id ? 700 : 400,
                                background: currentBook?.id === book.id ? "var(--app-bg-warm)" : "transparent",
                              }}
                            >
                              {book.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "var(--app-gray-lt)" }}>
                          New Testament
                        </h3>
                        <div>
                          {newTestamentBooks.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => handleSelectBook(book)}
                              data-testid={`book-${book.abbreviation}`}
                              className="w-full text-left px-2 py-2 font-serif text-[16px] transition-colors"
                              style={{
                                color: currentBook?.id === book.id ? "var(--app-green)" : "var(--app-dark)",
                                fontWeight: currentBook?.id === book.id ? 700 : 400,
                                background: currentBook?.id === book.id ? "var(--app-bg-warm)" : "transparent",
                              }}
                            >
                              {book.name}
                            </button>
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
                <button
                  disabled={!currentBook}
                  data-testid="button-select-chapter"
                  className="px-4 py-1.5 text-[13px] font-semibold disabled:opacity-30"
                  style={{ border: "1px solid var(--app-border)", color: "var(--app-dark)" }}
                >
                  Ch. {currentChapter?.number || "-"}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[50vh]">
                <SheetHeader>
                  <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>Select Chapter</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-5 gap-2 mt-4 max-h-[35vh] overflow-y-auto p-2">
                  {chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChapter(ch.id)}
                      data-testid={`chapter-${ch.number}`}
                      className="py-2.5 text-[14px] font-semibold transition-colors"
                      style={
                        currentChapter?.id === ch.id
                          ? { background: "var(--cta-bg)", color: "var(--cta-fg)" }
                          : { background: "transparent", color: "var(--app-dark)", border: "1px solid var(--app-border)" }
                      }
                    >
                      {ch.number}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <button
            onClick={handleNextChapter}
            disabled={!currentChapter?.next}
            className="p-2 disabled:opacity-30 transition-opacity"
            style={{ color: "var(--app-green)" }}
            data-testid="button-next-chapter"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto md:px-16 md:max-w-3xl">
        {!currentChapter && !chapterLoading && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-10 h-10 mx-auto mb-6" style={{ color: "var(--app-green)" }} />
            <h2 className="font-serif text-[28px] text-[var(--app-dark)] mb-3">Select a Book</h2>
            <p className="text-[var(--app-gray-lt)] mb-6 max-w-xs mx-auto">
              Choose a book to begin reading
            </p>
            <button
              onClick={() => setBookSheetOpen(true)}
              className="px-8 py-3 font-semibold text-[13px] tracking-[0.15em] uppercase"
              style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
              data-testid="button-browse-books"
            >
              Browse Books
            </button>
          </motion.div>
        )}

        {chapterLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--app-green)" }} />
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
                  <div className="p-2 flex items-center justify-between gap-2" style={{ background: "var(--app-white)", border: "1px solid var(--app-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                    <span className="text-[13px] px-2" style={{ color: "var(--app-gray-lt)" }}>
                      {highlightedVerses.size} verse{highlightedVerses.size > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="flex items-center px-3 py-1.5 text-[12px] font-semibold"
                        style={{ color: "var(--app-green)" }}
                        onClick={() => handleSaveHighlighted(verses)}
                        data-testid="button-save-verses"
                      >
                        <Bookmark className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        className="flex items-center px-3 py-1.5 text-[12px] font-semibold"
                        style={{ color: "var(--app-green)" }}
                        onClick={() => handleReflectHighlighted(verses)}
                        data-testid="button-reflect-verses"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Reflect
                      </button>
                      <button
                        className="flex items-center px-3 py-1.5 text-[12px] font-semibold"
                        style={{ color: "var(--app-green)" }}
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
                            const appUrl = `${window.location.origin}/bible?book=${encodeURIComponent(currentChapter?.reference?.split(" ").slice(0,-1).join(" ") || "")}&chapter=${encodeURIComponent(currentChapter?.number || "")}`;
                            const fullShare = `${shareText}\n\nRead it in context on SoulGuide: ${appUrl}`;
                            if (navigator.share) {
                              navigator.share({
                                title: `${ref} — SoulGuide`,
                                text: shareText,
                                url: appUrl,
                              });
                            } else {
                              navigator.clipboard.writeText(fullShare);
                            }
                          }}
                        data-testid="button-share-verses"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </button>
                      <button
                        className="flex items-center px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
                        style={{ color: "var(--app-green)" }}
                        onClick={() => handleShareVerseImage(verses)}
                        disabled={generatingImage}
                        data-testid="button-share-verse-image"
                        title="Share as image"
                      >
                        {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-1.5"
                        style={{ color: "var(--app-gray-lt)" }}
                        onClick={() => setHighlightedVerses(new Set())}
                        data-testid="button-clear-selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: animateContent ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-1"
            >
              <h2 className="hidden md:block font-serif text-[64px] leading-none text-[var(--app-dark)] mb-10">
                {currentBook?.name || currentChapter?.reference?.split(" ").slice(0, -1).join(" ")}
                <sup className="text-[28px] text-[var(--app-gray-lt)] ml-1">{currentChapter?.number}</sup>
              </h2>
              {verses.map((verse, index) => (
                <motion.p
                  key={verse.number}
                  data-verse={verse.number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleVerseClick(verse.number)}
                  style={{ fontSize: "calc(19px * var(--reading-scale, 1))" }}
                  className={cn(
                    "font-serif leading-[1.7] py-2 px-3 -mx-3 cursor-pointer transition-colors",
                    highlightedVerses.has(verse.number) ? "bg-[var(--cta-bg)] text-[var(--cta-fg)]" : "hover:bg-[var(--app-green)]/5 text-[var(--app-dark)]"
                  )}
                >
                  <span className={cn("font-bold text-[13px] mr-2", highlightedVerses.has(verse.number) ? "text-[var(--cta-fg)]/70" : "text-[var(--app-green)]")}>{verse.number}</span>
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
            <SheetTitle className="font-serif" style={{ color: "var(--app-dark)" }}>Your Collection</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            {bookmarkGroups.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--app-border)" }} />
                <p className="text-[14px]" style={{ color: "var(--app-gray-lt)" }}>No verses saved yet</p>
                <p className="text-[12px] mt-1" style={{ color: "var(--app-gray-lt)" }}>
                  Tap verses to highlight, then save
                </p>
              </div>
            ) : (
              <div>
                {bookmarkGroups.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="cursor-pointer py-4 border-b border-[var(--app-border-soft)]"
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
                    <p className="text-[11px] font-semibold tracking-wide mb-2" style={{ color: "var(--app-green)" }}>
                      {bookmark.reference}
                    </p>
                    <div className="line-clamp-4">
                      {bookmark.verses.map((v) => (
                        <p key={v.number} className="font-serif text-[14px] leading-relaxed text-[var(--app-dark)]">
                          <span className="text-[11px] mr-1" style={{ color: "var(--app-gray-lt)" }}>{v.number}</span>
                          {v.text}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      </div>

      {/* Desktop study rail: real personal notes + curated cross references */}
      {currentChapter && (
        <ReaderStudyRail
          reference={currentChapter.reference || ""}
          bookId={currentBook?.id}
          chapter={Number(currentChapter.number) || undefined}
          onNavigate={navigateToVerse}
        />
      )}
    </div>
  );
}

// ── Reader study rail: personal notes (real CRUD) + cross references (curated) ──
function ReaderStudyRail({ reference, bookId, chapter, onNavigate }:
  { reference: string; bookId?: string; chapter?: number; onNavigate: (ref: string) => void }) {
  const [notes, setNotes] = useState<Array<{ id: number; title: string | null; body: string; reference: string; createdAt: string }>>([]);
  const [crossRefs, setCrossRefs] = useState<Array<{ reference: string; votes: number }>>([]);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/bible/notes?ref=${encodeURIComponent(reference)}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setNotes(d.notes || []); }
    } catch {}
  }, [reference]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    if (!reference) return;
    fetch(`/api/bible/cross-references?ref=${encodeURIComponent(reference)}`, { credentials: "include" })
      .then((r) => r.json()).then((d) => setCrossRefs(d.references || [])).catch(() => setCrossRefs([]));
  }, [reference]);

  const saveNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/bible/notes", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ reference, bookId, chapter, title: draftTitle || null, body: draft }),
      });
      if (res.ok) { setDraft(""); setDraftTitle(""); await loadNotes(); }
    } catch {} finally { setSaving(false); }
  };

  const deleteNote = async (id: number) => {
    try { await fetch(`/api/bible/notes/${id}`, { method: "DELETE", credentials: "include" }); await loadNotes(); } catch {}
  };

  return (
    <aside className="hidden md:flex flex-col md:sticky md:top-0 md:h-screen md:w-[340px] md:shrink-0 border-l border-[var(--app-dark)] bg-[var(--app-bg)] overflow-y-auto pt-8">
      {/* Cross references */}
      <div className="px-6 py-4 border-b border-[var(--app-dark)]">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Cross References</span>
      </div>
      <div className="px-6 py-4 border-b border-[var(--app-border)]">
        {crossRefs.length === 0 ? (
          <p className="text-[13px] text-[var(--app-gray-lt)] italic leading-relaxed">No cross references for this passage yet.</p>
        ) : (
          <div className="space-y-4">
            {crossRefs.map((c, i) => (
              <button key={i} onClick={() => onNavigate(c.reference)} className="block text-left w-full group">
                <p className="font-bold text-[15px] text-[var(--app-dark)] group-hover:text-[var(--app-green)]">{c.reference}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Personal notes */}
      <div className="px-6 py-4 border-b border-[var(--app-dark)]">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Personal Notes</span>
      </div>
      <div className="px-6 py-4 border-b border-[var(--app-border)]">
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Note title (optional)"
          className="w-full bg-[var(--app-white)] border border-[var(--app-border)] focus:border-[var(--app-green)] outline-none px-3 py-2 text-[14px] font-serif text-[var(--app-dark)] mb-2 rounded"
        />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Write a note on ${reference}…`}
          rows={3}
          className="w-full bg-[var(--app-white)] border border-[var(--app-border)] focus:border-[var(--app-green)] outline-none px-3 py-2 text-[14px] font-serif text-[var(--app-dark)] resize-none rounded mb-2"
        />
        <button onClick={saveNote} disabled={!draft.trim() || saving}
          className="w-full bg-[var(--cta-bg)] text-[var(--cta-fg)] text-[10px] font-semibold tracking-[0.18em] uppercase py-2.5 rounded disabled:opacity-40">
          {saving ? "Saving…" : "Save Note"}
        </button>
      </div>
      <div className="flex-1">
        {notes.length === 0 ? (
          <p className="px-6 py-5 text-[13px] text-[var(--app-gray-lt)] italic">No notes on this chapter yet.</p>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {notes.map((n) => (
              <div key={n.id} className="border border-[var(--app-border)] p-4 group relative">
                {n.title && <p className="font-bold text-[15px] text-[var(--app-dark)] mb-1">{n.title}</p>}
                <p className="text-[14px] text-[var(--app-gray)] leading-relaxed">{n.body}</p>
                <div className="flex justify-end mt-3">
                  <span className="text-[10px] text-[var(--app-gray-lt)] border border-[var(--app-border)] px-2 py-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-GB").replace(/\//g, ".") : ""}
                  </span>
                </div>
                <button onClick={() => deleteNote(n.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--app-gray-lt)] hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
