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
  model?: string; // LaunchDarkly-controlled — overrides PRIMARY_AI_MODEL env var
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
  if (message.includes("credit balance") || message.includes("too low")) return true;
  const errorMessage = err.error?.error?.message || "";
  if (errorMessage.includes("credit balance") || errorMessage.includes("too low")) return true;
  return false;
}

function sanitizeText(text: string): string {
  return text.replace(/—/g, ", ").replace(/–/g, ", ");
}

async function* streamFromClaude(options: HybridStreamOptions): AsyncGenerator<StreamChunk> {
  const { systemPrompt, messages, maxTokens = 1024, model } = options;
  const stream = anthropic.messages.stream({
    model: model || process.env.PRIMARY_AI_MODEL || "claude-sonnet-4-5",
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
    model: process.env.FALLBACK_AI_MODEL || "gpt-4o-mini",
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
    if (!isAnthropicTransientError(error)) {
      console.error("[HybridAI] Claude failed with non-transient error:", error);
      throw error;
    }

    if (hasYieldedContent) {
      // Claude already streamed part of a response to the client before
      // failing. We can't un-send what's already been rendered there, so
      // falling back to OpenAI now would append a second, complete answer
      // right after the partial one — a garbled, duplicated message. It's
      // safer to end the stream cleanly and let the partial text stand as
      // the final response than to silently corrupt it.
      console.warn(
        "[HybridAI] Claude failed mid-stream after yielding content — ending stream instead of falling back, to avoid a duplicated response."
      );
      yield { provider: "claude", content: "", done: true };
      return;
    }

    console.log("[HybridAI] Claude unavailable, falling back to GPT-4o-mini...");
    try {
      for await (const chunk of streamFromOpenAI(options)) {
        yield chunk;
      }
      console.log("[HybridAI] OpenAI fallback completed successfully");
    } catch (openaiError) {
      console.error("[HybridAI] OpenAI fallback failed:", openaiError);
      throw openaiError;
    }
  }
}

export const hybridAIClient = {
  streamChat: hybridStreamChat,
  isTransientError: isAnthropicTransientError,
  complete: hybridComplete,
};

/**
 * Non-streaming single-shot completion with Claude -> OpenAI fallback.
 * Returns the model's text output. Used for one-shot tasks like Bible search
 * that expect a JSON string back. Falls back to OpenAI on transient/credit
 * errors, the same policy as the streaming chat path.
 */
export async function hybridComplete(options: {
  systemPrompt?: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
  jsonMode?: boolean;
}): Promise<string> {
  const { systemPrompt, prompt, maxTokens = 1024, model } = options;
  try {
    const response = await anthropic.messages.create({
      model: model || process.env.PRIMARY_AI_MODEL || "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b: any) => b.type === "text") as any;
    return block?.text || "";
  } catch (error) {
    if (!isAnthropicTransientError(error)) {
      throw error;
    }
    console.log("[HybridAI] Claude unavailable for completion, falling back to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: process.env.FALLBACK_AI_MODEL || "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
    });
    const choice = completion.choices[0];
    console.log("[HybridAI] OpenAI fallback finish_reason:", choice?.finish_reason);
    return choice?.message?.content || "";
  }
}
