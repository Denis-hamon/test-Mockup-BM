"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  name: string;
  className?: string;
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-2", className)}
      aria-live="polite"
    >
      <span className="text-sm text-muted-foreground" aria-hidden="true">
        {name} ecrit
        <span className="ml-0.5 inline-flex gap-px">
          <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
      </span>
      <span className="sr-only">
        {name} est en train d&apos;ecrire un message
      </span>
    </div>
  );
}
