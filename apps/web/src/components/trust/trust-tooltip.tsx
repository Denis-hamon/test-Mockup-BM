"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustTooltip({
  content,
  children,
  className,
}: {
  content: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ?? (
          <button
            type="button"
            className={cn("inline-flex items-center", className)}
            aria-label={content}
          >
            <Lock
              data-icon="inline-start"
              className="text-[hsl(var(--trust))]"
            />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
