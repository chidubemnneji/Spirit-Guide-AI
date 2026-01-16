import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, MessageCircle, Bookmark, Star, Clock } from "lucide-react";
import type { Devotional } from "@shared/schema";

interface DevotionalCardProps {
  devotional: Devotional;
  onBeginReflection: () => void;
  onComplete: (timeSpentSeconds: number) => void;
  onBookmark: () => void;
  onRate: (rating: number) => void;
  isBookmarked?: boolean;
}

export function DevotionalCard({
  devotional,
  onBeginReflection,
  onComplete,
  onBookmark,
  onRate,
  isBookmarked = false,
}: DevotionalCardProps) {
  const [startTime] = useState(() => Date.now());
  const [rating, setRating] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleComplete = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete(timeSpent);
  };

  const handleRate = (value: number) => {
    setRating(value);
    onRate(value);
  };

  return (
    <Card className="shadow-lg" data-testid="card-devotional">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h2 className="text-xl font-serif font-semibold text-foreground" data-testid="text-devotional-title">
              {devotional.title}
            </h2>
            {devotional.subtitle && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-devotional-subtitle">
                {devotional.subtitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBookmark}
            className={isBookmarked ? "text-primary" : "text-muted-foreground"}
            data-testid="button-bookmark"
          >
            <Bookmark className={isBookmarked ? "fill-current" : ""} size={20} />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Clock size={14} />
          <span>{devotional.estimatedReadTime || 5} min read</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-primary/5 rounded-lg p-4" data-testid="section-scripture">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary" data-testid="text-scripture-reference">
              {devotional.scriptureReference}
            </span>
          </div>
          <p className="font-serif text-lg italic text-foreground" data-testid="text-scripture">
            "{devotional.scriptureText}"
          </p>
        </div>

        <div data-testid="section-opening">
          <p className="text-foreground leading-relaxed">{devotional.openingHook}</p>
        </div>

        <Separator />

        <div className="space-y-4" data-testid="section-reflection">
          {devotional.reflectionContent.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <Separator />

        <div className="bg-accent/10 rounded-lg p-4" data-testid="section-practice">
          <h3 className="font-semibold text-foreground mb-2">Today's Practice</h3>
          <p className="text-foreground">{devotional.todaysPractice}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4" data-testid="section-prayer">
          <h3 className="font-semibold text-foreground mb-2">Closing Prayer</h3>
          <p className="italic text-foreground">{devotional.closingPrayer}</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-1" data-testid="section-rating">
            <span className="text-sm text-muted-foreground mr-2">How was this devotional?</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="icon"
                onClick={() => handleRate(value)}
                className="h-8 w-8"
                data-testid={`button-rate-${value}`}
              >
                <Star
                  size={18}
                  className={value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                />
              </Button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleComplete}
              data-testid="button-complete"
            >
              Mark Complete
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                handleComplete();
                onBeginReflection();
              }}
              data-testid="button-begin-reflection"
            >
              <MessageCircle size={18} className="mr-2" />
              Begin Reflection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
