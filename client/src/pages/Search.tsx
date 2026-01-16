import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Bookmark, Loader2, X, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useBible } from "@/context/BibleContext";

const FEELING_SUGGESTIONS = [
  { label: "Anxious", query: "anxious worry peace" },
  { label: "Fear", query: "fear afraid courage" },
  { label: "Hope", query: "hope promise future" },
  { label: "Peace", query: "peace calm rest" },
  { label: "Strength", query: "strength power endure" },
  { label: "Comfort", query: "comfort sorrow heal" },
  { label: "Lonely", query: "alone presence with me" },
  { label: "Grateful", query: "thanks praise blessing" },
];

export default function Search() {
  const [, navigate] = useLocation();
  const { currentVersion } = useBible();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<{ text: string; reference: string } | null>(null);
  const [showReflectionCTA, setShowReflectionCTA] = useState(false);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim() || !currentVersion) return;

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/bible/${currentVersion.id}/search?query=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.verses || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBookmark = (verse: any) => {
    const verseKey = verse.reference;
    const newBookmarks = new Set(bookmarkedVerses);
    
    if (newBookmarks.has(verseKey)) {
      newBookmarks.delete(verseKey);
      setShowReflectionCTA(false);
    } else {
      newBookmarks.add(verseKey);
      setSelectedVerse({
        text: verse.text,
        reference: verse.reference,
      });
      setShowReflectionCTA(true);
    }
    setBookmarkedVerses(newBookmarks);
  };

  const handleReflect = () => {
    if (selectedVerse) {
      navigate(`/chat?verse=${encodeURIComponent(selectedVerse.reference)}&text=${encodeURIComponent(selectedVerse.text)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 pt-12 pb-4">
          <h1 className="font-serif text-2xl font-semibold text-center mb-1">
            Search by Feeling
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Find verses that speak to how you're feeling
          </p>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="How are you feeling today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-10"
                data-testid="input-feeling-search"
              />
            </div>
            <Button 
              onClick={() => handleSearch()} 
              disabled={searchLoading}
              size="icon"
              variant="ghost"
              className="text-primary"
              data-testid="button-search"
            >
              {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {searchResults.length === 0 && !searchLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm text-muted-foreground text-center mb-4">
              Tap a feeling to find verses
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FEELING_SUGGESTIONS.map((feeling, index) => (
                <motion.div
                  key={feeling.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base font-medium"
                    onClick={() => {
                      setSearchQuery(feeling.label.toLowerCase());
                      handleSearch(feeling.query);
                    }}
                    data-testid={`button-feeling-${feeling.label.toLowerCase()}`}
                  >
                    {feeling.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {searchLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Finding verses for you...</p>
          </div>
        )}

        <AnimatePresence>
          {!searchLoading && searchResults.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchResults.length} verses found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              {searchResults.slice(0, 10).map((result: any, index: number) => {
                const verseKey = result.reference;
                const isBookmarked = bookmarkedVerses.has(verseKey);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                  >
                    <Card className="p-4 shadow-md border-0 bg-card">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="font-serif text-base leading-relaxed text-foreground/90 mb-2">
                            {result.text}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.reference}
                          </p>
                        </div>
                        <motion.button
                          className={cn(
                            "p-1 h-fit rounded-md transition-colors shrink-0",
                            isBookmarked ? "text-primary" : "text-muted-foreground/50 hover:text-primary/70"
                          )}
                          onClick={() => handleBookmark(result)}
                          whileTap={{ scale: 0.9 }}
                          animate={{ scale: isBookmarked ? 1.2 : 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          data-testid={`button-bookmark-${index}`}
                        >
                          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                        </motion.button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
