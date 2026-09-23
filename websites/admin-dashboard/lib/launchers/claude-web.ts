import { CLAUDE_PROMPT_MAX_ENCODED_CHARS } from "./claude-terminal"
import { encodePrompt, type LaunchTarget } from "./types"

/**
 * The web/mobile session link — Anthropic's documented universal link
 * (support.claude.com/en/articles/14898120). On a phone with the Claude app
 * installed the OS hands the tap straight to the app's new-session composer;
 * anywhere else the same URL opens that form in the browser. That fallback is
 * the whole reason to prefer it: the board is a phone-first screen.
 *
 * Params are `q` (prompt), `repo` (one `owner/name`), and optional `branch`
 * (requires `repo`) and `mode`. Every launcher on the board passes
 * `mode=plan`: a stub or a maintenance pass is picked up by planning first,
 * not by editing. `repo` is encoded to `owner%2Fname`, as the article's own
 * example writes it.
 *
 * The article documents no cap on `q`, so this inherits the terminal
 * scheme's (see `CLAUDE_PROMPT_MAX_ENCODED_CHARS`).
 */
export const claudeWeb: LaunchTarget = {
  id: "claude-web",
  label: "Claude Code",
  surface: "web",
  supports: { repo: true, mode: true, model: false, effort: false },
  maxEncodedPromptChars: CLAUDE_PROMPT_MAX_ENCODED_CHARS,
  build(req) {
    const q = encodePrompt(req.prompt, CLAUDE_PROMPT_MAX_ENCODED_CHARS)
    if (q === null) return null
    const repo = encodeURIComponent(req.repoFullName)
    return `https://claude.ai/code/new?q=${q}&repo=${repo}&mode=${req.mode}`
  },
}
