"use client";

import * as React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: "fade" | "slide" | "scale" | "slide-left";
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ children, className, staggerDelay = 0.1, animation = "slide" }, ref) => {
    const variants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={itemVariants[animation]}
            transition={{ duration: 0.3 }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }
);
AnimatedList.displayName = "AnimatedList";

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade" | "slide" | "scale" | "slide-left";
  delay?: number;
}

const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, className, animation = "slide", delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={itemVariants[animation]}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, delay }}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedListItem.displayName = "AnimatedListItem";

// Staggered grid animation
interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  staggerDelay?: number;
}

const AnimatedGrid = React.forwardRef<HTMLDivElement, AnimatedGridProps>(
  ({ children, className, columns = 3, staggerDelay = 0.05 }, ref) => {
    const gridVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariant: Variants = {
      hidden: { opacity: 0, scale: 0.9, y: 20 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 24,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "grid gap-4",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          className
        )}
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariant}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }
);
AnimatedGrid.displayName = "AnimatedGrid";

export { AnimatedList, AnimatedListItem, AnimatedGrid };
