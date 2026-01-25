import { motion } from "framer-motion";
import { ContinueButton } from "./ContinueButton";
import { Star } from "lucide-react";

interface TestimonialsProps {
  onNext: () => void;
}

const testimonials = [
  {
    name: "Sarah",
    text: "Soulguide gave me the breakthrough I'd been praying for. The daily verses speak directly to my struggles.",
    rating: 5,
  },
  {
    name: "Michael",
    text: "I've tried other devotional apps, but Soulguide truly understands my journey. Personalized guidance is transformative.",
    rating: 5,
  },
  {
    name: "Rachel",
    text: "The moment I started using it, everything changed. It's like having a spiritual mentor in my pocket.",
    rating: 5,
  },
];

export function Testimonials({ onNext }: TestimonialsProps) {
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Believers Worldwide Are Discovering Their Purpose
        </h1>
        <p className="text-muted-foreground">
          Over 20 million faithful believers guided daily
        </p>
      </motion.div>

      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="font-medium text-foreground mb-1">{testimonial.name}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "{testimonial.text}"
            </p>
          </motion.div>
        ))}
      </div>

      <ContinueButton onClick={onNext} data-testid="button-testimonials-continue" />
    </motion.div>
  );
}
