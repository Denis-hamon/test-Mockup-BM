"use client";

import { useRef, useState, useCallback, type KeyboardEvent } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncryptionBadge } from "./encryption-badge";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping: () => void;
  onAttach?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  onSend,
  onTyping,
  onAttach,
  disabled,
  className,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      onSend(trimmed);
      setText("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setText(value);

    // Debounce typing indicator (2s)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping();
      typingTimeoutRef.current = null;
    }, 200);
    // Fire immediately on first keystroke, then debounce
    if (!typingTimeoutRef.current) {
      onTyping();
    }
  };

  // Auto-resize textarea (max 4 lines)
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20; // ~text-sm line-height
    const maxHeight = lineHeight * 4 + 16; // 4 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      <div className="flex items-end gap-2">
        {/* Attach button */}
        {onAttach && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttach}
            disabled={disabled || sending}
            className="shrink-0"
            aria-label="Joindre un fichier"
          >
            <Paperclip className="size-4" data-icon />
          </Button>
        )}

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ecrivez votre message..."
            disabled={disabled || sending}
            rows={1}
            className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Message"
          />
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || sending || !text.trim()}
          className="shrink-0"
          aria-label="Envoyer"
        >
          <SendHorizontal className="size-4" data-icon />
        </Button>
      </div>

      {/* Encryption badge below input */}
      <div className="mt-2">
        <EncryptionBadge variant="inline" />
      </div>
    </div>
  );
}
