// Reading a model's answer, for the two features that ask for one.
//
// `enrichment.ts` and `triage.ts` both ask the Gateway for a JSON object and
// both have to survive the same three things: fences a model was told not to
// send, a sentence of preamble in front of the brace, and the word "unknown"
// where a null belongs. That is the whole of this module — two functions, no
// schema, no validation. What each field is *allowed* to be stays with the
// feature that owns the field, because that is where the closed sets live.
//
// It is deliberately not a JSON-schema layer. The AI SDK has `generateObject`,
// and it is not used here for the reason nothing else in this package imports
// the SDK: the prompt builders are pure and the call is the caller's, which is
// what lets the same prompt run from a screen and from a script.

/**
 * The first JSON object in the text, or null.
 *
 * Tolerant on the way in — a model told "no fences" still sometimes sends
 * fences, and refusing a whole pass over three backticks would be a worse
 * answer than reading past them.
 */
export function firstJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "")
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start === -1 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1))
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * One string field, trimmed and capped — or null.
 *
 * The null-words list is the point. A model with nothing to say reaches for
 * "unknown", "n/a" or "none" far more readily than for a JSON null, and the
 * string "unknown" landing in a column somebody then reads as a sector is a
 * quieter failure than an empty one.
 */
export function jsonText(value: unknown, limit = 200): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (trimmed === "" || /^(null|n\/?a|unknown|none|-)$/i.test(trimmed)) return null
  return trimmed.slice(0, limit)
}
