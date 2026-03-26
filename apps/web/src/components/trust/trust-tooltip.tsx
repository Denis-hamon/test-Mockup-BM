"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function TrustTooltip({
  content,
  children,
  className,
}: {
  content: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ?? (
          <span
            className={cn(
              "inline-flex cursor-help text-[hsl(var(--trust))]",
              className
            )}
          >
            <Lock data-icon className="h-4 w-4" />
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
