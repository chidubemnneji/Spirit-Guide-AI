/**
 * Robustly extract JSON from an Anthropic message response.
 *
 * The AI services prompt for "JSON only", but models sometimes wrap JSON in
 * prose, code fences, or thinking blocks, or truncate at max_tokens. This
 * helper finds the first text block, strips fences, and extracts the first
 * balanced JSON object/array, so a minor formatting deviation doesn't cause a
 * silent fallback.
 *
 * Returns the parsed value, or null if no valid JSON could be extracted.
 * Callers should treat null as a genuine failure (and log it distinctly from
 * a successful-but-empty result).
 */
export function extractJson<T = any>(response: { content?: Array<any> } | null | undefined): T | null {
  if (!response?.content || !Array.isArray(response.content)) return null;

  // Find the first text block (skip thinking/tool blocks).
  const textBlock = response.content.find((b) => b?.type === "text" && typeof b.text === "string");
  if (!textBlock) return null;

  let raw: string = textBlock.text;

  // Strip code fences.
  raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Fast path: whole string is JSON.
  try {
    return JSON.parse(raw) as T;
  } catch {
    // fall through to substring extraction
  }

  // Extract the first balanced {...} or [...] region.
  const start = raw.search(/[{[]/);
  if (start === -1) return null;
  const open = raw[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const candidate = raw.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
