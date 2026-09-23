# Session launchers — breakdown

- epic: session-launchers
- cut: 2026-09-23, from Jamie's brief and a read of the Tickets board's launch code
  (`websites/admin-dashboard/lib/tickets.ts`, `components/ticket-detail.tsx`,
  `app/(app)/tickets/page.tsx`) against Anthropic's two link docs
- scope: `websites/admin-dashboard` only. No `biz.*` change, no new env vars.

## What was understood

- **"Start in Claude Code" already picks the repo, and that works.** Every launcher builds
  `claude.ai/code/new?q=…&repo=owner%2Fname&mode=plan` (the documented universal link);
  the terminal twin builds `claude-cli://open?repo=owner/name&q=…`. Repo preselection is
  kept as-is — this epic must not regress it.
- **Model and effort are not preselected, and neither link documents a way to.** The
  universal-link article lists `q` (alias `prompt`), `repo`, `branch`, `mode`
  (`plan|code`). The deep-links doc lists `q`, `cwd`, `repo`. Nothing for model or
  effort. `lib/tickets.ts` deliberately separates documented URLs from guesses (it moved
  off the undocumented `claude.ai/code?prompt=…` shape for that reason), so wiring
  either is gated on a verification spike, not assumed.
- **The launch code is Claude-shaped and scattered.** `newSessionUrl`,
  `claudePromptUrl`, `claudeSessionUrl`, `claudeTerminalUrl`, the maintenance / recut /
  estate-check launchers, and the 4,500-char prompt cap all live inline in a 1,400-line
  `lib/tickets.ts`, and the UI hard-codes the two Claude links by name. Adding another
  tool today means touching every one of those call sites.
- **The goal is a dropdown of tools, later.** Codex, opencode, Hermes and others should
  each be addable as one small module. None of them is built in this epic.

## Decisions (Jamie's, 2026-09-23)

1. **A launcher registry, not more `claude*Url` functions.** One module owns "turn a
   launch request into a URL"; each tool is a *target* declaring its capabilities and a
   pure `build()`; the board asks the registry, never a tool by name. Claude web and
   Claude terminal are the first two targets.
2. **Model and effort are derived, never authored.** No new stub dash-lines. A single
   rule in code maps what a ticket already carries (kind, lane, `size`) and what a
   maintenance launcher is to a *tool-neutral* recommendation (tier + effort); each
   target translates that into its own vocabulary, or ignores it.
3. **Spike before wiring.** Stub 2 first verifies whether `claude.ai/code/new` and
   `claude-cli://open` honour any model / effort parameter. Only confirmed parameters go
   in a URL, recorded in the README's link table as verified-by-hand with the date. What
   is not confirmed is shown next to the button instead.
4. **Repo preselection is preserved byte-for-byte.** Stub 1 is a pure refactor: every
   URL the board emits today is identical after it.
5. **Other tools are future triage stubs**, each citing that tool's own documented link
   shape before it is added. No guessed URL schemes.
6. **Launch in `code`, never `plan`** (added 2026-09-23). Every launcher moves from
   `mode=plan` to `mode=code` — carried by stub 2, since it already changes the link's
   parameters. Stub 1 stays byte-identical. The cloud **environment** has no documented
   link parameter: it comes from the claude.ai/code selector or the org default, and stub 2
   records that rather than guessing one.

## Build order

1. `launcher-registry` — extract the registry and move both Claude links and every
   launcher onto it. No behaviour change. **The foundation.**
2. `model-effort-preselect` — depends on 1. Switch to `mode=code`; spike the parameters, add the derivation
   rule, wire what is confirmed, surface the rest.
3. `launcher-dropdown` — depends on 1 and 2. Turn "Start in Claude Code" into a split
   button whose menu lists the registered targets.

## Sources

- `websites/admin-dashboard/lib/tickets.ts` — § "Claude deep links" (`newSessionUrl`,
  `PROMPT_MAX_ENCODED_CHARS`, `claudeSessionUrl`, `claudeTerminalUrl`) and § "Maintenance
  launchers" (`repoMaintenanceLaunchers`, `recutSessionUrl`, `estateCheckSessionUrl`).
- `websites/admin-dashboard/components/ticket-detail.tsx`, `board-ticket-row.tsx`,
  `batch-row.tsx`, `repo-maintenance.tsx`, `app/(app)/tickets/page.tsx` — the consumers.
- `websites/admin-dashboard/README.md` § Tickets — the link table.
- support.claude.com/en/articles/14898120 (universal link) ·
  code.claude.com/docs/en/deep-links (`claude-cli://`).
