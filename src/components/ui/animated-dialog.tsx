"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const AnimatedDialog = DialogPrimitive.Root;
const AnimatedDialogTrigger = DialogPrimitive.Trigger;
const AnimatedDialogPortal = DialogPrimitive.Portal;
const AnimatedDialogClose = DialogPrimitive.Close;

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

const AnimatedDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} asChild {...props}>
    <motion.div
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
        className
      )}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.2 }}
    />
  </DialogPrimitive.Overlay>
));
AnimatedDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface AnimatedDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  animation?: "scale" | "slide-up" | "slide-down" | "fade";
}

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, y: 50, transition: { duration: 0.15 } },
};

const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, y: -50, transition: { duration: 0.15 } },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const animationVariants: Record<string, Variants> = {
  scale: contentVariants,
  "slide-up": slideUpVariants,
  "slide-down": slideDownVariants,
  fade: fadeVariants,
};

const AnimatedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AnimatedDialogContentProps
>(({ className, children, animation = "scale", ...props }, ref) => (
  <AnimatedDialogPortal>
    <AnimatePresence>
      <AnimatedDialogOverlay />
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            className
          )}
          variants={animationVariants[animation]}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatePresence>
  </AnimatedDialogPortal>
));
AnimatedDialogContent.displayName = DialogPrimitive.Content.displayName;

const AnimatedDialogHeader = ({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    {children}
  </motion.div>
);
AnimatedDialogHeader.displayName = "AnimatedDialogHeader";

const AnimatedDialogFooter = ({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
  >
    {children}
  </motion.div>
);
AnimatedDialogFooter.displayName = "AnimatedDialogFooter";

const AnimatedDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
AnimatedDialogTitle.displayName = DialogPrimitive.Title.displayName;

const AnimatedDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AnimatedDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  AnimatedDialog,
  AnimatedDialogPortal,
  AnimatedDialogOverlay,
  AnimatedDialogTrigger,
  AnimatedDialogClose,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogFooter,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
};
