"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/**
 * Hook wrapping useChat for the intake follow-up AI conversation.
 *
 * Connects to /api/chat/intake with step context data.
 * Returns the full useChat API for chat interaction.
 */
export function useIntakeChat(
  stepIndex: number,
  stepData: Record<string, unknown>
) {
  return useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/intake",
      body: { stepData: { stepIndex, ...stepData } },
    }),
    initialMessages: [],
  });
}
