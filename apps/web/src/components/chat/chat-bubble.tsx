"use client";

import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Lock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatBubbleMessage {
  id: string;
  content: string;
  isSent: boolean;
  timestamp: Date;
  readAt?: Date | null;
  showReadReceipt: boolean;
  optimistic?: boolean;
  failed?: boolean;
  attachment?: { name: string; size: number; id: string } | null;
}

interface ChatBubbleProps {
  message: ChatBubbleMessage;
  onRetry?: (messageId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ---------------------------------------------------------------------------
// Date separator
// ---------------------------------------------------------------------------

export function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) {
    label = "Aujourd'hui";
  } else if (isYesterday(date)) {
    label = "Hier";
  } else {
    label = format(date, "d MMMM yyyy", { locale: fr });
  }

  return (
    <div className="flex items-center justify-center py-4" aria-label={label}>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

export function ChatBubble({ message, onRetry }: ChatBubbleProps) {
  const {
    id,
    content,
    isSent,
    timestamp,
    readAt,
    showReadReceipt,
    optimistic,
    failed,
    attachment,
  } = message;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isSent ? "items-end" : "items-start",
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[75%] px-3 py-2 text-sm",
          isSent
            ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-md bg-muted text-foreground",
          optimistic && "opacity-50",
          failed && "border-2 border-destructive",
        )}
      >
        {content && <p className="whitespace-pre-wrap break-words">{content}</p>}

        {/* Attachment */}
        {attachment && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-lg border p-2",
              isSent
                ? "border-primary-foreground/20"
                : "border-border",
            )}
          >
            <FileText className="size-4 shrink-0" data-icon />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1 truncate text-xs font-semibold">
                {attachment.name}
                <Lock className="size-3 shrink-0 opacity-70" data-icon />
              </span>
              <span className="text-xs opacity-70">
                {formatFileSize(attachment.size)} &middot; Fichier chiffre
              </span>
            </div>
          </div>
        )}

        {/* Retry button on failure */}
        {failed && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(id)}
            className="absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            aria-label="Renvoyer le message"
          >
            <RotateCcw className="size-3" data-icon />
          </button>
        )}
      </div>

      {/* Metadata: timestamp + read receipt */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-1 text-xs text-muted-foreground",
          isSent ? "flex-row-reverse" : "flex-row",
        )}
      >
        <time dateTime={timestamp.toISOString()}>{formatTime(timestamp)}</time>
        {isSent && showReadReceipt && readAt && (
          <span className="text-xs text-muted-foreground">Lu</span>
        )}
      </div>
    </div>
  );
}
