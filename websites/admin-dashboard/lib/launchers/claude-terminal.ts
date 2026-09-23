import { encodePrompt, type LaunchTarget } from "./types"

/**
 * The ceiling on an encoded Claude prompt. A ticket's `## Prompt` section is
 * unbounded, and the terminal scheme documents a 5,000-character maximum on
 * `q` (the web link documents none, so it inherits this one — one cap, one
 * fallback). Past it both Claude targets return null and the row falls back
 * to **Copy prompt**, which is right there and has no limit — better than
 * emitting a URL that truncates without saying so.
 *
 * Measured on the *encoded* value, which is the conservative reading: the doc
 * more likely means the decoded text (its own "prompts over 1,000 characters"
 * warning counts what the user sees), so a budget spent here is never a
 * budget overspent there.
 *
 * 4,500 leaves ~10% margin under the documented limit. It is not arbitrary:
 * house prose is dense with em-dashes and backticks and encodes at roughly
 * 1.5x, so this is about 3,000 characters of an actual ticket — clear of the
 * longest prompt in this repo (3,826 encoded) with room to spare, where 4,000
 * would have cleared it by 4%. Raising it past 5,000 is the one thing that
 * needs Anthropic to say so first.
 */
export const CLAUDE_PROMPT_MAX_ENCODED_CHARS = 4500

/** Claude's name for each tier, shared by both Claude targets. Aliases, not
 * dated model IDs: `opus` keeps meaning the current Opus. */
export const CLAUDE_MODEL_ALIASES = {
  fast: "haiku",
  balanced: "sonnet",
  deep: "opus",
} as const

/**
 * The terminal twin — the documented `claude-cli://` scheme
 * (code.claude.com/docs/en/deep-links). Opens a local Claude Code session in
 * whichever clone of the repo that machine last ran `claude` in, with the same
 * prompt already in the input box. The click never sends anything: the prompt
 * sits there, flagged as coming from an external link, until Enter is pressed
 * — which is why a plain `<a href>` is safe here.
 *
 * `repo` keeps its literal slash, as the doc's example writes it; only `q` is
 * documented as needing encoding. The scheme documents no `mode`, so the
 * request's is dropped — and no model or effort, so the hint is too.
 */
export const claudeTerminal: LaunchTarget = {
  // Parked 2026-09-23: tapped from the board it opened nothing (triage stub
  // `claude-terminal-link-opens-nothing`). Delete this line once it does.
  parked: "Not working yet",
  id: "claude-terminal",
  label: "Claude Code (terminal)",
  surface: "terminal",
  supports: { repo: true, mode: false, model: false, effort: false },
  modelAliases: CLAUDE_MODEL_ALIASES,
  maxEncodedPromptChars: CLAUDE_PROMPT_MAX_ENCODED_CHARS,
  build(req) {
    const q = encodePrompt(req.prompt, CLAUDE_PROMPT_MAX_ENCODED_CHARS)
    if (q === null) return null
    return `claude-cli://open?repo=${req.repoFullName}&q=${q}`
  },
}
