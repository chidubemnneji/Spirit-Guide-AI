import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cross, Clock, BookOpen, MessageCircle } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Knows Your Journey",
    description: "Every conversation builds on what I already know about your struggles with anxiety and your goals.",
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "3 AM and can't sleep? Triggered and need help NOW? I'm here. No judgment. No waiting.",
  },
  {
    icon: BookOpen,
    title: "Biblically Grounded",
    description: "Every answer is rooted in Scripture. I'll guide you with God's truth, not my opinions.",
  },
];

export default function MeetPrayerPartner() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col px-5 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-14 h-14 rounded-2xl border-2 border-foreground flex items-center justify-center mb-8"
        >
          <MessageCircle className="w-7 h-7 text-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl font-bold text-foreground leading-tight mb-4"
        >
          Meet Your Personal Prayer Partner
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-muted-foreground mb-8"
        >
          I know your story. I know your struggles. I'm here 24/7 to guide you closer to God.
        </motion.p>

        <div className="space-y-3 flex-1">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="border-2 border-border shadow-none">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button
            size="lg"
            onClick={() => setLocation("/chat?new=true")}
            className="w-full rounded-2xl bg-foreground text-background hover:bg-foreground/90"
            data-testid="button-start-conversation"
          >
            Start Your First Conversation
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
