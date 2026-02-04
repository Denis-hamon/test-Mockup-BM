"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "rectangular" | "text";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "shimmer";
}

const AnimatedSkeleton = React.forwardRef<HTMLDivElement, AnimatedSkeletonProps>(
  ({ className, variant = "default", width, height, animation = "shimmer" }, ref) => {
    const variantClasses = {
      default: "rounded-md",
      circular: "rounded-full",
      rectangular: "rounded-none",
      text: "rounded h-4 w-full",
    };

    if (animation === "shimmer") {
      return (
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden bg-muted",
            variantClasses[variant],
            className
          )}
          style={{ width, height }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear" as const,
            }}
          />
        </div>
      );
    }

    if (animation === "pulse") {
      return (
        <motion.div
          ref={ref}
          className={cn(
            "bg-muted",
            variantClasses[variant],
            className
          )}
          style={{ width, height }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      );
    }

    // wave animation
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-muted bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]",
          variantClasses[variant],
          className
        )}
        style={{ width, height }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear" as const,
        }}
      />
    );
  }
);
AnimatedSkeleton.displayName = "AnimatedSkeleton";

// Card skeleton with multiple lines
interface CardSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ className, lines = 3, showAvatar = false, showImage = false }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("p-4 rounded-lg border bg-card space-y-4", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {showImage && (
          <AnimatedSkeleton className="w-full h-40 rounded-md" />
        )}
        <div className="flex items-center gap-3">
          {showAvatar && (
            <AnimatedSkeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <AnimatedSkeleton className="h-4 w-3/4" />
            <AnimatedSkeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <AnimatedSkeleton
              key={i}
              className="h-3"
              width={`${100 - i * 15}%`}
            />
          ))}
        </div>
      </motion.div>
    );
  }
);
CardSkeleton.displayName = "CardSkeleton";

// Table row skeleton
interface TableRowSkeletonProps {
  columns?: number;
  className?: string;
}

const TableRowSkeleton = React.forwardRef<HTMLDivElement, TableRowSkeletonProps>(
  ({ columns = 4, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("flex items-center gap-4 p-4 border-b", className)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <AnimatedSkeleton
            key={i}
            className="h-4 flex-1"
            width={i === 0 ? "40%" : `${25 - i * 5}%`}
          />
        ))}
      </motion.div>
    );
  }
);
TableRowSkeleton.displayName = "TableRowSkeleton";

export { AnimatedSkeleton, CardSkeleton, TableRowSkeleton };
