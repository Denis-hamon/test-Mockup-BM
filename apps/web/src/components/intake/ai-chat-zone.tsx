"use client";

import { useEffect, useRef, useState } from "react";
import { useIntakeChat } from "@/hooks/use-intake-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, SkipForward, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatZoneProps {
  stepIndex: number;
  stepData: Record<string, unknown>;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Detects if a message text contains all three emergency numbers,
 * indicating a sensitive case alert from the AI.
 */
function isSensitiveAlert(text: string): boolean {
  return text.includes("3114") && text.includes("17") && text.includes("119");
}

export function AIChatZone({
  stepIndex,
  stepData,
  onComplete,
  onSkip,
}: AIChatZoneProps) {
  const {
    messages,
    sendMessage,
    status,
    input,
    setInput,
    handleSubmit,
  } = useIntakeChat(stepIndex, stepData);

  const [visible, setVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-trigger first AI message on mount
  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;
    sendMessage({
      role: "user",
      content: `L'utilisateur vient de completer l'etape ${stepIndex + 1}. Voici ses reponses: ${JSON.stringify(stepData)}. Posez 1 a 3 questions de suivi pertinentes.`,
    });
  }, [stepIndex, stepData, sendMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = status === "streaming";

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 p-4 transition-opacity duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-busy={isStreaming}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="size-4" />
        <span>Questions complementaires</span>
      </div>

      {/* Messages area */}
      <div
        role="log"
        aria-live="polite"
        className="mb-4 max-h-[300px] space-y-3 overflow-y-auto"
      >
        {messages.map((message) => {
          // Skip the initial context message from showing in UI
          if (
            message.role === "user" &&
            message.parts?.[0]?.type === "text" &&
            message.parts[0].text.startsWith("L'utilisateur vient de completer")
          ) {
            return null;
          }

          const isAssistant = message.role === "assistant";
          const textContent = message.parts
            ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
            .map((part) => part.text)
            .join("") ?? "";

          if (!textContent) return null;

          const hasSensitive = isAssistant && isSensitiveAlert(textContent);

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isAssistant ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  isAssistant
                    ? "border bg-background"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {hasSensitive ? (
                  <div>
                    {/* Render text before the sensitive block */}
                    <p className="whitespace-pre-wrap">{textContent}</p>
                    <div
                      role="alert"
                      className="mt-2 rounded border-amber-200 border-l-3 border-l-amber-500 bg-amber-50 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Heart className="mt-0.5 size-4 text-amber-600" />
                        <div className="text-sm">
                          <p className="font-semibold">
                            Si vous etes en danger ou en detresse, n&apos;hesitez
                            pas a contacter :
                          </p>
                          <ul className="mt-1 space-y-0.5 font-semibold">
                            <li>3114 — Prevention du suicide (24h/24)</li>
                            <li>17 — Police secours</li>
                            <li>119 — Enfance en danger</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{textContent}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex justify-start">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="sr-only">L&apos;assistant redige une reponse...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Text input */}
      <form
        onSubmit={handleSubmit}
        className="mb-3 flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tapez votre reponse..."
          disabled={isStreaming}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isStreaming || !input.trim()}
        >
          Envoyer
        </Button>
      </form>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          aria-label="Passer les questions complementaires"
        >
          <SkipForward className="mr-1 size-3" />
          Passer
        </Button>
        <Button type="button" size="sm" onClick={onComplete}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
