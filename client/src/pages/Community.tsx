import { motion } from "framer-motion";
import { Users, Heart, MessageCircle, Sparkles, Send } from "lucide-react";
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
    color: "text-[hsl(var(--struggling))]",
    bgColor: "bg-[hsl(var(--struggling)/0.15)]",
  },
  {
    icon: Sparkles,
    title: "Daily Inspiration",
    description: "Receive and give encouragement to others",
    color: "text-[hsl(var(--hopeful))]",
    bgColor: "bg-[hsl(var(--hopeful)/0.15)]",
  },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-[9999] border-b border-border/50 glass">
        <div className="flex items-center gap-3 px-4 h-14">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold tracking-premium">Community</span>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(var(--sage)/0.2)] flex items-center justify-center mx-auto mb-6 shadow-elevated"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Users className="w-12 h-12 text-primary" />
          </motion.div>
          
          <motion.h1 
            className="font-serif text-3xl font-bold tracking-display mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Faith Community
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground max-w-sm mx-auto tracking-refined leading-relaxed"
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-premium text-center">
            Coming Features
          </p>
          
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card className="glass-subtle glow-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${feature.bgColor} flex items-center justify-center`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold tracking-refined">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground tracking-refined mt-0.5">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="glass-subtle glow-border overflow-hidden">
            <div className="gradient-primary p-6 text-white">
              <h3 className="font-serif text-xl font-bold tracking-display mb-2">
                Get Early Access
              </h3>
              <p className="text-white/80 text-sm tracking-refined">
                Be the first to know when Community launches. We'll keep you updated!
              </p>
            </div>
            <CardContent className="p-4">
              <Button 
                className="w-full gradient-sage shadow-sage text-white"
                data-testid="button-notify-me"
              >
                <Send className="w-4 h-4 mr-2" />
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-8 tracking-refined"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Your privacy matters. All community features will be opt-in.
        </motion.p>
      </main>
    </div>
  );
}
