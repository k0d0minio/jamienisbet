# Stub: Extract a launcher registry behind "Start in Claude Code"

- feature-slug: launcher-registry
- sequence: 1 of 3
- depends-on: none
- size: M

## What this is

The Tickets board's launch links are built by Claude-specific functions spread through
`lib/tickets.ts` and named directly by the UI. This stub pulls them behind one small,
tool-neutral module so a new tool is a new file, not a sweep. **Pure refactor: every URL
the board emits is byte-identical before and after**, repo preselection included.

Target shape (names are a suggestion; keep the house comment density):

```ts
// websites/admin-dashboard/lib/launchers/types.ts
export type LaunchMode = "plan" | "code"
/** Tool-neutral — filled by stub 2; optional here and ignored by every target. */
export type LaunchHint = { tier: "fast" | "balanced" | "deep"; effort: "low" | "medium" | "high" | "xhigh" | "max" }

export type LaunchRequest = {
  repoFullName: string   // "owner/name"
  prompt: string         // decoded; each target encodes its own way
  mode: LaunchMode
  hint?: LaunchHint
}

export type LaunchTarget = {
  id: string             // "claude-web", "claude-terminal"; later "codex-web", "opencode", …
  label: string          // menu text, e.g. "Claude Code"
  surface: "web" | "terminal" | "ide"
  /** What this target can carry, so the UI can say why it is unavailable. */
  supports: { repo: boolean; mode: boolean; model: boolean; effort: boolean }
  maxEncodedPromptChars: number | null
  /** Pure. Null when this request cannot be expressed (e.g. prompt past the cap). */
  build(req: LaunchRequest): string | null
}
```

- `lib/launchers/claude-web.ts` and `lib/launchers/claude-terminal.ts` — move the
  existing `newSessionUrl` / `claude-cli://` logic and their doc-citing comments here
  verbatim. The 4,500 cap moves with them as each target's `maxEncodedPromptChars`
  (both keep 4,500; the comment explaining the number moves too).
- `lib/launchers/index.ts` — the ordered registry (`LAUNCH_TARGETS`, `DEFAULT_TARGET_ID
  = "claude-web"`), `getTarget(id)`, and `launch(targetId, req)`. Adding a tool = one
  file + one line here.
- `lib/tickets.ts` keeps its exported names (`claudeSessionUrl`, `claudeTerminalUrl`,
  `recutSessionUrl`, `estateCheckSessionUrl`, `repoMaintenanceLaunchers`) as thin
  wrappers over `launch()` for now, so no component changes in this stub. Stub 3
  replaces the wrappers with a target-aware API.

## Prompt

In this repo, refactor the admin dashboard's session-launch links into a modular
launcher registry, with no behaviour change. Read this stub first —
`.icm/intake/session-launchers/launcher-registry.md` — then the epic breakdown
`.icm/intake/session-launchers/breakdown.md`, then
`websites/admin-dashboard/lib/tickets.ts` § "Claude deep links" and § "Maintenance
launchers", and `websites/admin-dashboard/README.md` § Tickets.

1. Before changing anything, record the exact URLs the board produces today for: a
   short stub prompt, a pipeline verb, a prompt just under and just over the 4,500
   encoded-char cap, each maintenance launcher, recut and the estate check. Keep them
   for step 4.
2. Create `websites/admin-dashboard/lib/launchers/` with `types.ts`, `claude-web.ts`,
   `claude-terminal.ts` and `index.ts` as described in the stub. Move the logic and its
   documentation comments; don't rewrite them.
3. Re-implement the existing exports in `lib/tickets.ts` as wrappers over the registry.
   No component file changes.
4. Show that every URL from step 1 is byte-identical (a throwaway script is fine; don't
   commit it). Repo preselection must be unchanged.
5. Update `websites/admin-dashboard/README.md` § Tickets to say where the link builders
   now live.

Don't run build/lint/typecheck locally — CI is the source of truth. Ship on a `claude/`
branch through a PR, and in that PR `git mv` this stub to
`.icm/intake/session-launchers/_done/`.
