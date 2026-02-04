"use client";

import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}

const AnimatedNumber = React.forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  ({ value, className, duration = 0.5, formatOptions, prefix = "", suffix = "" }, ref) => {
    const spring = useSpring(0, {
      stiffness: 100,
      damping: 30,
      duration: duration * 1000,
    });

    const display = useTransform(spring, (current) => {
      const formatted = new Intl.NumberFormat("en-US", formatOptions).format(
        Math.round(current)
      );
      return `${prefix}${formatted}${suffix}`;
    });

    React.useEffect(() => {
      spring.set(value);
    }, [spring, value]);

    return (
      <motion.span ref={ref} className={cn("tabular-nums", className)}>
        {display}
      </motion.span>
    );
  }
);
AnimatedNumber.displayName = "AnimatedNumber";

// Counting animation with flip effect
interface FlipNumberProps {
  value: number;
  className?: string;
  digitClassName?: string;
}

const FlipNumber = React.forwardRef<HTMLDivElement, FlipNumberProps>(
  ({ value, className, digitClassName }, ref) => {
    const digits = value.toString().padStart(2, "0").split("");

    return (
      <div ref={ref} className={cn("flex", className)}>
        {digits.map((digit, index) => (
          <motion.div
            key={`${index}-${digit}`}
            className={cn(
              "relative overflow-hidden bg-muted rounded px-2 py-1 mx-0.5",
              digitClassName
            )}
            initial={{ rotateX: -90 }}
            animate={{ rotateX: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.05,
            }}
          >
            <span className="font-mono font-bold">{digit}</span>
          </motion.div>
        ))}
      </div>
    );
  }
);
FlipNumber.displayName = "FlipNumber";

// Stat card with animated number
interface AnimatedStatProps {
  label: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const AnimatedStat = React.forwardRef<HTMLDivElement, AnimatedStatProps>(
  ({ label, value, previousValue, prefix = "", suffix = "", trend, className }, ref) => {
    const percentChange = previousValue
      ? ((value - previousValue) / previousValue) * 100
      : 0;
    const actualTrend = trend || (percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral");

    return (
      <motion.div
        ref={ref}
        className={cn("p-4 rounded-lg bg-card border", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            className="text-2xl font-bold"
          />
          {previousValue !== undefined && (
            <motion.span
              className={cn(
                "text-xs font-medium mb-1",
                actualTrend === "up" && "text-green-500",
                actualTrend === "down" && "text-red-500",
                actualTrend === "neutral" && "text-muted-foreground"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {actualTrend === "up" && "↑"}
              {actualTrend === "down" && "↓"}
              {Math.abs(percentChange).toFixed(1)}%
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }
);
AnimatedStat.displayName = "AnimatedStat";

export { AnimatedNumber, FlipNumber, AnimatedStat };
