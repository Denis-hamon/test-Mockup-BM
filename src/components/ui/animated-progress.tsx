"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "gradient";
  animated?: boolean;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
};

const AnimatedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  AnimatedProgressProps
>(({
  className,
  value = 0,
  showValue = false,
  size = "md",
  variant = "default",
  animated = true,
  ...props
}, ref) => {
  const progressValue = value || 0;

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-primary/20",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <motion.div
          className={cn(
            "h-full w-full flex-1 rounded-full",
            variantClasses[variant],
            animated && variant !== "gradient" && "relative overflow-hidden"
          )}
          initial={{ width: "0%" }}
          animate={{ width: `${progressValue}%` }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* Animated shimmer effect */}
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </motion.div>
      </ProgressPrimitive.Root>

      {showValue && (
        <motion.span
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={progressValue}
        >
          {Math.round(progressValue)}%
        </motion.span>
      )}
    </div>
  );
});
AnimatedProgress.displayName = "AnimatedProgress";

// Circular progress variant
interface CircularProgressProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "danger";
  showValue?: boolean;
  className?: string;
}

const circularVariantColors = {
  default: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-yellow-500",
  danger: "stroke-red-500",
};

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value = 0, size = 60, strokeWidth = 6, variant = "default", showValue = true, className }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={circularVariantColors[variant]}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {showValue && (
          <motion.span
            className="absolute text-sm font-semibold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            key={value}
          >
            {Math.round(value)}%
          </motion.span>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

export { AnimatedProgress, CircularProgress };
