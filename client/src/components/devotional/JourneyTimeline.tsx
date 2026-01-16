import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Star, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Devotional } from "@shared/schema";

interface JourneyEntry {
  devotional: Devotional;
  completedAt: Date | string | null;
  rating: number | null;
}

interface JourneyTimelineProps {
  entries: JourneyEntry[];
}

export function JourneyTimeline({ entries }: JourneyTimelineProps) {
  if (entries.length === 0) {
    return (
      <Card data-testid="card-journey-empty">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Your spiritual journey timeline will appear here as you complete devotionals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-journey-timeline">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          Your Journey
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const completedDate = entry.completedAt 
                ? new Date(entry.completedAt) 
                : null;
              
              return (
                <div key={entry.devotional.id} className="relative pl-10" data-testid={`timeline-entry-${entry.devotional.id}`}>
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {entry.devotional.title}
                        </h4>
                        {completedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(completedDate, "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      {entry.rating && (
                        <div className="flex items-center gap-0.5">
                          {[...Array(entry.rating)].map((_, i) => (
                            <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <BookOpen size={12} />
                      <span>{entry.devotional.scriptureReference}</span>
                    </div>
                    
                    {entry.devotional.themes && entry.devotional.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.devotional.themes.slice(0, 3).map((theme, i) => (
                          <span
                            key={i}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
