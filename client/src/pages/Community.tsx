import { motion } from "framer-motion";
import { Users, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MessageCircle,
    title: "Prayer Circles",
    description: "Join small groups for shared prayer and encouragement",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Heart,
    title: "Faith Stories",
    description: "Share and read testimonies from fellow believers",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Sparkles,
    title: "Daily Inspiration",
    description: "Receive and give encouragement to others",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border">
        <div className="flex items-center gap-3 px-5 h-14">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg font-semibold">Community</span>
        </div>
      </header>

      <main className="px-5 py-6 max-w-lg mx-auto">
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Users className="w-10 h-10 text-primary" />
          </motion.div>
          
          <motion.h1 
            className="font-serif text-2xl font-bold mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Faith Community
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Connect with fellow seekers who understand your journey. Together, we're stronger.
          </motion.p>
        </motion.div>

        <motion.div 
          className="space-y-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Coming Features
          </p>
          
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card className="border-0 shadow-sm" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-feature-description-${index}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button 
            className="rounded-xl"
            disabled
            data-testid="button-coming-soon"
          >
            Coming Soon
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            We're working hard to bring community features to you
          </p>
        </motion.div>
      </main>
    </div>
  );
}
