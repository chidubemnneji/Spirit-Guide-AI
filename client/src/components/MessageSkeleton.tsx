import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  count?: number;
  className?: string;
}

function SingleMessageSkeleton({ index }: { index: number }) {
  const isUser = index % 2 === 1;
  
  return (
    <motion.div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-full animate-shimmer flex-shrink-0" />
      )}
      
      <div className={cn(
        "flex flex-col gap-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div 
          className={cn(
            "h-4 rounded-md animate-shimmer",
            isUser ? "w-24" : "w-32"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        />
        <div 
          className={cn(
            "rounded-2xl p-4 space-y-2",
            isUser 
              ? "bg-primary/10 rounded-tr-md" 
              : "bg-muted/50 rounded-tl-md"
          )}
        >
          <div 
            className="h-4 w-48 rounded-md animate-shimmer"
            style={{ animationDelay: `${index * 100 + 50}ms` }}
          />
          <div 
            className="h-4 w-40 rounded-md animate-shimmer"
            style={{ animationDelay: `${index * 100 + 100}ms` }}
          />
          {!isUser && (
            <div 
              className="h-4 w-32 rounded-md animate-shimmer"
              style={{ animationDelay: `${index * 100 + 150}ms` }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MessageSkeleton({ count = 3, className }: MessageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SingleMessageSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-xl border border-border/50 p-4 space-y-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-md animate-shimmer" />
          <div className="h-3 w-48 rounded-md animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-md animate-shimmer" />
        <div className="h-3 w-3/4 rounded-md animate-shimmer" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
      <div className="w-12 h-12 rounded-full animate-shimmer" />
      <div className="h-6 w-8 rounded-md animate-shimmer" />
      <div className="h-3 w-16 rounded-md animate-shimmer" />
    </div>
  );
}
