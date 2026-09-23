import { encodePrompt, type LaunchTarget } from "./types"

/** Claude's name for each tier. An alias, never a dated model ID, so it does
 * not rot. */
export const CLAUDE_MODEL_ALIASES = {
  fast: "haiku",
  balanced: "sonnet",
  deep: "opus",
} as const

/**
 * The ceiling on an encoded Claude prompt (code.claude.com/docs/en/deep-links
 * documents 5,000 on `q`; this repo's web link documents none, so it
 * inherits the same one — one cap, one fallback). Past it `build()` returns
 * null and the row falls back to **Copy prompt**, which is right there and
 * has no limit — better than emitting a URL that truncates without saying so.
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

/**
 * The web/mobile session link — Anthropic's documented universal link
 * (support.claude.com/en/articles/14898120). On a phone with the Claude app
 * installed the OS hands the tap straight to the app's new-session composer;
 * anywhere else the same URL opens that form in the browser. That fallback is
 * the whole reason to prefer it: the board is a phone-first screen.
 *
 * Params are `q` (prompt), `repo` (one `owner/name`), and optional `branch`
 * (requires `repo`) and `mode` (`plan` or `code`). Every launcher on the
 * board passes `mode=code`, explicitly rather than by omission, so a session
 * never inherits a sticky plan pick from the composer. `repo` is encoded to
 * `owner%2Fname`, as the article's own example writes it.
 *
 * No model or effort parameter is documented, and none is wired: the board
 * shows its recommendation beside the button instead (README § Tickets has
 * the hand-verified table of what the link was seen to honour).
 *
 * The article documents no cap on `q`, so this inherits the terminal
 * scheme's (see `CLAUDE_PROMPT_MAX_ENCODED_CHARS`).
 */
export const claudeWeb: LaunchTarget = {
  id: "claude-web",
  label: "Claude Code",
  surface: "web",
  supports: { repo: true, mode: true, model: false, effort: false },
  modelAliases: CLAUDE_MODEL_ALIASES,
  maxEncodedPromptChars: CLAUDE_PROMPT_MAX_ENCODED_CHARS,
  build(req) {
    const q = encodePrompt(req.prompt, CLAUDE_PROMPT_MAX_ENCODED_CHARS)
    if (q === null) return null
    const repo = encodeURIComponent(req.repoFullName)
    return `https://claude.ai/code/new?q=${q}&repo=${repo}&mode=${req.mode}`
  },
}
