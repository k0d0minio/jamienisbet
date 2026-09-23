# Bug: drop-terminal-launcher

- observed: the Tickets board's "Claude Code (terminal)" menu entry (`claude-cli://open?repo=…&q=…`)
  did nothing when tapped · expected: it opens a local Claude Code terminal session
- cause: not a defect in this repo — the URL was built exactly to Anthropic's documented shape.
  Live debugging on the operator's machine (Linux/GNOME/Brave) walked through Claude Code CLI's
  local URL-scheme registration (present), the `x-scheme-handler/claude-cli` MIME default
  (missing, then set), and GNOME's desktop-file cache (`update-desktop-database` failed because
  `~/.local/share/applications` had lost its read permission) — fixing all three still left the
  link inert in Brave. The operator decided the feature isn't worth the per-machine fragility.
- fix: `websites/admin-dashboard/lib/launchers/`: deleted `claude-terminal.ts`, dropped it from
  `LAUNCH_TARGETS` in `index.ts` (now `[claudeWeb]` only), moved the shared
  `CLAUDE_MODEL_ALIASES`/`CLAUDE_PROMPT_MAX_ENCODED_CHARS` constants into `claude-web.ts` (the
  only remaining target), and updated `types.ts`'s `id` comment. `README.md` § Tickets: removed
  the terminal row from the target table and recorded why it was tried and dropped.
- changelog: entry added (menu entry removed is user-visible)
- learned: none
