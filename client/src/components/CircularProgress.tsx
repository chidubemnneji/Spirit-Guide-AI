import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  color?: "primary" | "sage" | "hopeful" | "peaceful";
}

const colorMap = {
  primary: {
    stroke: "stroke-primary",
    bg: "stroke-primary/20",
    text: "text-primary",
  },
  sage: {
    stroke: "stroke-[hsl(var(--sage))]",
    bg: "stroke-[hsl(var(--sage)/0.2)]",
    text: "text-[hsl(var(--sage))]",
  },
  hopeful: {
    stroke: "stroke-[hsl(var(--hopeful))]",
    bg: "stroke-[hsl(var(--hopeful)/0.2)]",
    text: "text-[hsl(var(--hopeful))]",
  },
  peaceful: {
    stroke: "stroke-[hsl(var(--peaceful))]",
    bg: "stroke-[hsl(var(--peaceful)/0.2)]",
    text: "text-[hsl(var(--peaceful))]",
  },
};

export function CircularProgress({
  value,
  maxValue,
  size = 120,
  strokeWidth = 12,
  className,
  label,
  sublabel,
  color = "primary",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / maxValue, 1);
  
  const springValue = useSpring(0, { 
    stiffness: 40, 
    damping: 15,
    mass: 1,
  });
  
  const strokeDashoffset = useTransform(
    springValue,
    [0, 1],
    [circumference, circumference * (1 - percentage)]
  );

  useEffect(() => {
    springValue.set(1);
  }, [percentage, springValue]);

  const colors = colorMap[color];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          className={colors.bg}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={cn("text-3xl font-bold tracking-display", colors.text)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {value}
        </motion.span>
        {label && (
          <motion.span 
            className="text-xs font-medium text-muted-foreground tracking-refined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {label}
          </motion.span>
        )}
        {sublabel && (
          <motion.span 
            className="text-[10px] text-muted-foreground/70 tracking-refined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {sublabel}
          </motion.span>
        )}
      </div>
    </div>
  );
}

interface MultiRingProgressProps {
  rings: Array<{
    value: number;
    maxValue: number;
    color: "primary" | "sage" | "hopeful" | "peaceful";
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  className?: string;
  centerContent?: React.ReactNode;
}

export function MultiRingProgress({
  rings,
  size = 140,
  strokeWidth = 10,
  className,
  centerContent,
}: MultiRingProgressProps) {
  const gap = 4;
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ring, index) => {
          const ringRadius = (size - strokeWidth) / 2 - (strokeWidth + gap) * index;
          const circumference = 2 * Math.PI * ringRadius;
          const percentage = Math.min(ring.value / ring.maxValue, 1);
          const offset = circumference * (1 - percentage);
          const colors = colorMap[ring.color];
          
          return (
            <g key={index}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="transparent"
                strokeWidth={strokeWidth}
                className={colors.bg}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className={colors.stroke}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ 
                  delay: 0.1 * index,
                  duration: 1,
                  ease: [0.4, 0, 0.2, 1]
                }}
              />
            </g>
          );
        })}
      </svg>
      
      {centerContent && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {centerContent}
        </motion.div>
      )}
    </div>
  );
}
