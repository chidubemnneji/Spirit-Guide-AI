import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, Check, ThumbsUp, ChevronDown, ChevronUp, Star,
  Footprints, Hand, Pause, Pencil, Wind, BookOpen, Coffee,
  TreePine, Music, MessageCircle, Heart, Moon, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendationCard } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "footprints": Footprints,
  "hands": Hand,
  "pause": Pause,
  "pencil": Pencil,
  "wind": Wind,
  "book-open": BookOpen,
  "coffee": Coffee,
  "tree-pine": TreePine,
  "music": Music,
  "message-circle": MessageCircle,
  "heart": Heart,
  "moon": Moon,
  "sparkles": Sparkles,
};

function PracticeIcon({ iconName, className }: { iconName?: string | null; className?: string }) {
  const IconComponent = iconName ? iconMap[iconName] : Sparkles;
  const FinalIcon = IconComponent || Sparkles;
  return <FinalIcon className={cn("w-5 h-5", className)} />;
}

function getDifficultyLabel(duration: string | null): string {
  if (!duration) return "Easy";
  const minutes = parseInt(duration);
  if (minutes <= 3) return "Quick";
  if (minutes <= 5) return "Easy";
  if (minutes <= 10) return "Medium";
  return "Deep";
}

interface RecommendationCardsProps {
  cards: RecommendationCard[];
  onCardComplete?: (cardId: number) => void;
  onCardRate?: (cardId: number, rating: number) => void;
}

function PracticeCard({ 
  card, 
  onComplete, 
  onRate 
}: { 
  card: RecommendationCard; 
  onComplete?: (cardId: number) => void;
  onRate?: (cardId: number, rating: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(!!card.completed);
  const [rating, setRating] = useState<number | null>(card.helpfulRating);
  const [showRating, setShowRating] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !card.clicked) {
      try {
        await fetch(`/api/recommendations/${card.id}/click`, { method: "POST" });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    }
    setExpanded(!expanded);
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/recommendations/${card.id}/complete`, { method: "POST" });
      setCompleted(true);
      setShowRating(true);
      onComplete?.(card.id);
    } catch (error) {
      console.error("Error completing card:", error);
    } finally {
      setCompleting(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      await fetch(`/api/recommendations/${card.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
      setRating(stars);
      onRate?.(card.id, stars);
    } catch (error) {
      console.error("Error rating card:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300 cursor-pointer",
          "glass-subtle glow-border shadow-subtle hover:shadow-elevated",
          completed && "bg-primary/5 border-primary/30"
        )}
        data-testid={`card-practice-${card.id}`}
      >
        <CardHeader 
          className="p-4 cursor-pointer"
          onClick={handleExpand}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-gentle" />
              <div className="relative w-12 h-12 rounded-full bg-white dark:bg-card shadow-subtle flex items-center justify-center">
                <PracticeIcon iconName={card.iconEmoji} className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base tracking-refined leading-tight flex items-center gap-2">
                {card.title}
                {completed && <Check className="w-4 h-4 text-primary" />}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 tracking-refined line-clamp-2">
                {card.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {card.duration && (
                  <span className="badge-duration">
                    <Clock className="w-3 h-3" />
                    {card.duration}
                  </span>
                )}
                <span className="badge-difficulty">
                  {getDifficultyLabel(card.duration)}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <CardContent className="px-4 pb-4 pt-0">
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <h5 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-premium">
                    How to Practice
                  </h5>
                  <p className="text-sm leading-relaxed tracking-refined whitespace-pre-line">
                    {card.instructions}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                {!completed ? (
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full gradient-primary shadow-primary text-white font-semibold tracking-premium"
                    data-testid={`button-complete-${card.id}`}
                  >
                    {completing ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Completing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Mark as Complete
                      </span>
                    )}
                  </Button>
                ) : showRating && rating === null ? (
                  <motion.div 
                    className="w-full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-sm text-center text-muted-foreground mb-3 tracking-refined">
                      Was this helpful?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <motion.button
                          key={stars}
                          onClick={() => handleRate(stars)}
                          className="p-1"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          data-testid={`button-rate-${card.id}-${stars}`}
                        >
                          <Star 
                            className={cn(
                              "w-7 h-7 transition-colors",
                              "text-muted-foreground/40 hover:text-primary hover:fill-primary"
                            )} 
                          />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <ThumbsUp className="w-4 h-4 text-primary" />
                    {rating ? (
                      <span className="tracking-refined">Thank you for rating!</span>
                    ) : (
                      <span className="tracking-refined">Completed!</span>
                    )}
                  </motion.div>
                )}
              </CardFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function RecommendationCards({ cards, onCardComplete, onCardRate }: RecommendationCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <motion.div 
      className="space-y-3 mt-4" 
      data-testid="container-recommendation-cards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <p className="text-xs font-semibold text-primary uppercase tracking-premium flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        Suggested Practices
      </p>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 * index }}
        >
          <PracticeCard 
            card={card} 
            onComplete={onCardComplete}
            onRate={onCardRate}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
