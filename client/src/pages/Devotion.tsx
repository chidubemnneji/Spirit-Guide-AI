import { Heart } from "lucide-react";

export default function Devotion() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <Heart className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold">Daily Devotion</span>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Daily Devotion</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start each day with Scripture and reflection. Coming soon!
          </p>
        </div>
      </main>
    </div>
  );
}
