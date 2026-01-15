import { useState } from "react";
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
  return <FinalIcon className={cn("w-5 h-5 text-primary", className)} />;
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
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover-elevate",
        completed && "bg-primary/5 border-primary/30"
      )}
      data-testid={`card-practice-${card.id}`}
    >
      <CardHeader 
        className="p-3 cursor-pointer"
        onClick={handleExpand}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PracticeIcon iconName={card.iconEmoji} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight flex items-center gap-2">
                {card.title}
                {completed && <Check className="w-4 h-4 text-primary" />}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {card.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {card.duration && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {card.duration}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="bg-muted/50 rounded-lg p-3">
              <h5 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                How to Practice
              </h5>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {card.instructions}
              </p>
            </div>
          </CardContent>

          <CardFooter className="px-3 pb-3 pt-0">
            {!completed ? (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={completing}
                className="w-full"
                data-testid={`button-complete-${card.id}`}
              >
                {completing ? (
                  "Marking complete..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            ) : showRating && rating === null ? (
              <div className="w-full">
                <p className="text-xs text-center text-muted-foreground mb-2">
                  Was this helpful?
                </p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => handleRate(stars)}
                      className="p-1 hover:scale-110 transition-transform"
                      data-testid={`button-rate-${card.id}-${stars}`}
                    >
                      <Star 
                        className={cn(
                          "w-6 h-6",
                          "text-muted-foreground/50 hover:text-primary hover:fill-primary"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ThumbsUp className="w-4 h-4 text-primary" />
                {rating ? (
                  <span>Thank you for rating!</span>
                ) : (
                  <span>Completed!</span>
                )}
              </div>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default function RecommendationCards({ cards, onCardComplete, onCardRate }: RecommendationCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-2 mt-3" data-testid="container-recommendation-cards">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Suggested Practices
      </p>
      {cards.map((card) => (
        <PracticeCard 
          key={card.id} 
          card={card} 
          onComplete={onCardComplete}
          onRate={onCardRate}
        />
      ))}
    </div>
  );
}
