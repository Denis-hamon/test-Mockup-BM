"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500/10 text-green-600 dark:text-green-400",
        warning:
          "border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        info:
          "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AnimatedBadgeProps
  extends Omit<HTMLMotionProps<"span">, "children">,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
}

const AnimatedBadge = React.forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ className, variant, children, pulse = false, glow = false, ...props }, ref) => {
    return (
      <motion.span
        ref={ref}
        className={cn(
          badgeVariants({ variant }),
          glow && "shadow-lg shadow-current/20",
          className
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...(pulse && {
            boxShadow: [
              "0 0 0 0 currentColor",
              "0 0 0 4px transparent",
            ],
          }),
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
          ...(pulse && {
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }),
        }}
        whileHover={{ scale: 1.05 }}
        {...props}
      >
        {pulse && (
          <motion.span
            className="absolute inset-0 rounded-md"
            animate={{
              boxShadow: [
                "0 0 0 0 currentColor",
                "0 0 0 6px transparent",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
        {children}
      </motion.span>
    );
  }
);
AnimatedBadge.displayName = "AnimatedBadge";

// Status badge with automatic animation based on status
interface StatusBadgeProps extends Omit<AnimatedBadgeProps, "variant" | "pulse"> {
  status: "running" | "completed" | "failed" | "pending" | "paused" | "approved" | "transformed" | "collected" | "translated" | "published";
}

const statusConfig: Record<StatusBadgeProps["status"], { variant: AnimatedBadgeProps["variant"]; pulse: boolean; label: string }> = {
  running: { variant: "info", pulse: true, label: "Running" },
  completed: { variant: "success", pulse: false, label: "Completed" },
  failed: { variant: "destructive", pulse: false, label: "Failed" },
  pending: { variant: "secondary", pulse: false, label: "Pending" },
  paused: { variant: "warning", pulse: false, label: "Paused" },
  approved: { variant: "success", pulse: false, label: "Approved" },
  transformed: { variant: "warning", pulse: false, label: "Transformed" },
  collected: { variant: "secondary", pulse: false, label: "Collected" },
  translated: { variant: "info", pulse: false, label: "Translated" },
  published: { variant: "success", pulse: false, label: "Published" },
};

const AnimatedStatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, children, ...props }, ref) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <AnimatedBadge
        ref={ref}
        variant={config.variant}
        pulse={config.pulse}
        className={className}
        {...props}
      >
        {children || config.label}
      </AnimatedBadge>
    );
  }
);
AnimatedStatusBadge.displayName = "AnimatedStatusBadge";

export { AnimatedBadge, AnimatedStatusBadge, badgeVariants };
