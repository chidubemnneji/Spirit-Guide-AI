import { anthropic } from "./anthropicClient";
import { openai } from "./openaiClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChunk {
  provider: "claude" | "openai";
  content: string;
  done: boolean;
}

export interface HybridStreamOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

function isAnthropicTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as any;
  const status = err.status || err.statusCode || 0;
  if (status >= 500 || status === 429) return true;
  const errorType = err.error?.type || "";
  if (errorType === "overloaded_error" || errorType === "rate_limit_error") return true;
  const message = err.message || "";
  if (message.includes("overloaded") || message.includes("529")) return true;
  return false;
}

function sanitizeText(text: string): string {
  return text.replace(/—/g, "-").replace(/–/g, "-");
}

async function* streamFromClaude(options: HybridStreamOptions): AsyncGenerator<StreamChunk> {
  const { systemPrompt, messages, maxTokens = 1024 } = options;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const text = event.delta.text;
      if (text) {
        yield { provider: "claude", content: sanitizeText(text), done: false };
      }
    }
  }
  yield { provider: "claude", content: "", done: true };
}

async function* streamFromOpenAI(options: HybridStreamOptions): AsyncGenerator<StreamChunk> {
  const { systemPrompt, messages, maxTokens = 1024 } = options;

  const openaiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: openaiMessages,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield { provider: "openai", content: sanitizeText(content), done: false };
    }
  }
  yield { provider: "openai", content: "", done: true };
}

export async function* hybridStreamChat(
  options: HybridStreamOptions
): AsyncGenerator<StreamChunk> {
  let hasYieldedContent = false;
  
  try {
    console.log("[HybridAI] Attempting Claude...");
    for await (const chunk of streamFromClaude(options)) {
      if (!chunk.done && chunk.content) {
        hasYieldedContent = true;
      }
      yield chunk;
    }
    console.log("[HybridAI] Claude completed successfully");
  } catch (error) {
    if (isAnthropicTransientError(error)) {
      if (hasYieldedContent) {
        console.warn("[HybridAI] Claude failed mid-stream after yielding content. Partial response may be incomplete.");
      }
      console.log("[HybridAI] Claude unavailable, falling back to GPT-4o-mini...", error);
      try {
        for await (const chunk of streamFromOpenAI(options)) {
          yield chunk;
        }
        console.log("[HybridAI] OpenAI fallback completed successfully");
      } catch (openaiError) {
        console.error("[HybridAI] OpenAI fallback failed:", openaiError);
        throw openaiError;
      }
    } else {
      console.error("[HybridAI] Claude failed with non-transient error:", error);
      throw error;
    }
  }
}

export const hybridAIClient = {
  streamChat: hybridStreamChat,
  isTransientError: isAnthropicTransientError,
};
