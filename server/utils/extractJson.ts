/**
 * Robustly extract JSON from an AI model response.
 *
 * Models sometimes wrap JSON in prose or code fences, or truncate at
 * max_tokens. This helper finds the first text block, strips fences, extracts
 * the first balanced JSON object/array, and as a last resort salvages complete
 * objects from a truncated "results" array.
 *
 * Returns the parsed value, or null if nothing usable could be extracted.
 */
export function extractJson<T = any>(response: { content?: Array<any> } | null | undefined): T | null {
  if (!response?.content || !Array.isArray(response.content)) return null;
  const textBlock = response.content.find((b) => b?.type === "text" && typeof b.text === "string");
  if (!textBlock) return null;
  return extractJsonFromText<T>(textBlock.text);
}

/**
 * Extract JSON from a raw text string (e.g. a non-streaming completion).
 */
export function extractJsonFromText<T = any>(input: string | null | undefined): T | null {
  if (!input || typeof input !== "string") return null;

  const raw = input.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Fast path: the whole string is valid JSON.
  try {
    return JSON.parse(raw) as T;
  } catch {
    // fall through
  }

  // Extract the first balanced {...} or [...] region.
  const balanced = extractBalanced(raw);
  if (balanced !== null) {
    try {
      return JSON.parse(balanced) as T;
    } catch {
      // fall through to salvage
    }
  }

  // Truncation salvage: response was cut off mid-array (hit max_tokens).
  // Recover the complete objects collected so far inside a "results" array.
  const salvaged = salvageResultsArray(raw);
  if (salvaged !== null) {
    try {
      return JSON.parse(salvaged) as T;
    } catch {
      // fall through
    }
  }

  return null;
}

/** Return the first balanced {...} or [...] substring, or null. */
function extractBalanced(raw: string): string | null {
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
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Rebuild a {"results":[...]} object from however many complete objects exist
 * inside the (possibly truncated) results array.
 */
function salvageResultsArray(raw: string): string | null {
  const match = raw.match(/"results"\s*:\s*\[/);
  if (!match || match.index === undefined) return null;
  const arrStart = raw.indexOf("[", match.index);
  if (arrStart === -1) return null;

  const objects: string[] = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escaped = false;
  for (let i = arrStart + 1; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") { if (depth === 0) objStart = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        objects.push(raw.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }

  if (objects.length === 0) return null;
  return `{"results":[${objects.join(",")}]}`;
}
