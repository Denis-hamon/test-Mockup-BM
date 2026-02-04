"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const AnimatedTooltipProvider = TooltipPrimitive.Provider;
const AnimatedTooltip = TooltipPrimitive.Root;
const AnimatedTooltipTrigger = TooltipPrimitive.Trigger;

const AnimatedTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => (
  <AnimatePresence>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
        className
      )}
      asChild
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -2 }}
        transition={{
          duration: 0.15,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-primary" />
      </motion.div>
    </TooltipPrimitive.Content>
  </AnimatePresence>
));
AnimatedTooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  AnimatedTooltip,
  AnimatedTooltipTrigger,
  AnimatedTooltipContent,
  AnimatedTooltipProvider,
};
