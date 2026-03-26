import { streamText, convertToModelMessages } from "ai";
import {
  getModel,
  buildSystemPrompt,
  INTAKE_FOLLOWUP_OVERLAY,
} from "@legalconnect/ai";

export async function POST(req: Request) {
  const { messages, stepData } = await req.json();

  const systemPrompt = buildSystemPrompt(INTAKE_FOLLOWUP_OVERLAY, true);

  const result = streamText({
    model: getModel({ provider: "anthropic" }),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxOutputTokens: 500,
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
