// The launcher registry's vocabulary. A *launch request* is tool-neutral —
// which repo, what prompt, plan or code — and a *target* is one tool's way of
// turning it into a link a human taps. The board asks the registry
// (`./index.ts`), never a tool by name, so adding a tool is one file plus one
// line in the registry.

export type LaunchMode = "plan" | "code"

/** Tool-neutral model/effort recommendation. Declared ahead of the rule that
 * fills it (session-launchers stub 2); every target ignores it for now. */
export type LaunchHint = {
  tier: "fast" | "balanced" | "deep"
  effort: "low" | "medium" | "high" | "xhigh" | "max"
}

export type LaunchRequest = {
  /** "owner/name". */
  repoFullName: string
  /** Decoded — each target encodes it its own way. */
  prompt: string
  mode: LaunchMode
  hint?: LaunchHint
}

export type LaunchTarget = {
  /** "claude-web", "claude-terminal"; later "codex-web", "opencode", … */
  id: string
  /** Menu text, e.g. "Claude Code". */
  label: string
  surface: "web" | "terminal" | "ide"
  /** What this target can carry, so the UI can say why something is missing. */
  supports: { repo: boolean; mode: boolean; model: boolean; effort: boolean }
  /** The ceiling on the encoded prompt, or null when the tool documents none
   * and we have no reason to impose one. */
  maxEncodedPromptChars: number | null
  /** Pure. Null when this request cannot be expressed — e.g. the prompt is
   * past `maxEncodedPromptChars`. */
  build(req: LaunchRequest): string | null
}

/** The prompt URL-encoded, or null when it is past `max`. `encodeURIComponent`,
 * not `URLSearchParams`: the latter encodes spaces as `+`, and the docs'
 * examples use `%20`. */
export function encodePrompt(prompt: string, max: number | null): string | null {
  const encoded = encodeURIComponent(prompt)
  return max !== null && encoded.length > max ? null : encoded
}
