import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/CircularProgress";

interface GreetingCardProps {
  greeting: string;
  subtext: string;
  currentStreak: number;
  streakTarget: number;
}

export function GreetingCard({ greeting, subtext, currentStreak, streakTarget }: GreetingCardProps) {
  const progress = Math.min((currentStreak / streakTarget) * 100, 100);
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-0 shadow-lg" data-testid="card-greeting">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-serif font-semibold text-foreground" data-testid="text-greeting">
              {greeting}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-greeting-subtext">
              {subtext}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <CircularProgress 
              value={currentStreak} 
              maxValue={streakTarget}
              size={64} 
              strokeWidth={4}
              label="days"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
