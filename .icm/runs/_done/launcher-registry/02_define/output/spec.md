# Spec: Extract a launcher registry behind "Start in Claude Code"

- slug: launcher-registry
- personas: operator
- touches: websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/README.md
- complexity: standard

## Problem

Every session link the Tickets board emits — **Start in Claude Code**, **Open in terminal**,
the triage / sweep maintenance launchers, an epic's recut and the estate check — is built by
Claude-specific functions inline in a ~1,400-line `lib/tickets.ts` (`newSessionUrl`,
`claudePromptUrl`, `encodedTicketPrompt`, `claudeSessionUrl`, `claudeTerminalUrl`) and the
4,500-char cap lives beside them. Adding any other tool (the epic's end goal: a dropdown of
launch targets) would mean touching every one of those call sites. This run lays the foundation
of the `session-launchers` epic (decision 1 of the breakdown): one tool-neutral module that turns
a launch request into a URL, with Claude web and Claude terminal as its first two targets —
without changing a single URL (decision 4).

## Proposed change

A new folder `websites/admin-dashboard/lib/launchers/`:

- `types.ts` — `LaunchMode` (`"plan" | "code"`), `LaunchHint` (tool-neutral `tier` + `effort`;
  optional, declared now for stub 2, ignored by every target in this run), `LaunchRequest`
  (`repoFullName`, decoded `prompt`, `mode`, optional `hint`) and `LaunchTarget` (`id`, `label`,
  `surface`, `supports: { repo, mode, model, effort }`, `maxEncodedPromptChars`, and a pure
  `build(req) → string | null`).
- `claude-web.ts` — target `claude-web`: the universal link
  `https://claude.ai/code/new?q=…&repo=owner%2Fname&mode=<mode>`, moved with its doc-citing
  comments verbatim (including why `encodeURIComponent`, not `URLSearchParams`). Supports repo +
  mode; not model/effort.
- `claude-terminal.ts` — target `claude-terminal`: `claude-cli://open?repo=owner/name&q=…`
  (repo keeps its literal slash, as today), moved with its comments verbatim. Supports repo; not
  mode, model or effort — it ignores `mode` exactly as the current link does.
- The cap: each Claude target declares `maxEncodedPromptChars: 4500`; the comment explaining the
  number moves with it (once, in the module both targets import, not duplicated). `build()`
  returns null when the encoded prompt is past the target's cap — the check is on the encoded
  `q`, as today.
- `index.ts` — the ordered registry `LAUNCH_TARGETS` (`claude-web`, then `claude-terminal`),
  `DEFAULT_TARGET_ID = "claude-web"`, `getTarget(id)` and `launch(targetId, req)`. Adding a tool
  is one file plus one line here.

`lib/tickets.ts` keeps every exported name and signature — `claudeSessionUrl(ticket)` and
`claudeTerminalUrl(ticket)` stay `string | null`; `repoMaintenanceLaunchers`, `recutSessionUrl`
and `estateCheckSessionUrl` stay total (`string`) — re-implemented as thin wrappers over
`launch()` with `mode: "plan"`. The maintenance prompts are short authored literals that cannot
reach the cap, so their wrapper treats a null from `launch()` as a programming error and throws
rather than widening the return type (the "callers stay total" contract in today's
`claudePromptUrl` comment is kept). A ticket with no `pickup` still yields null before the
registry is called. No component file changes.

`websites/admin-dashboard/README.md` § Tickets: the link table and its prose say the builders now
live in `lib/launchers/` (one file per target, registry in `index.ts`), not inline in
`lib/tickets.ts`.

## Acceptance criteria

- [ ] `websites/admin-dashboard/lib/launchers/` holds `types.ts`, `claude-web.ts`, `claude-terminal.ts` and `index.ts`; `index.ts` exports `LAUNCH_TARGETS` (two targets, web first), `DEFAULT_TARGET_ID = "claude-web"`, `getTarget` and `launch`.
- [ ] Before/after, the URL strings are byte-identical for: a short stub prompt and a pipeline verb (web and terminal), a prompt just under and just over the 4,500 encoded-char cap (under → same URL on both; over → null on both), a ticket with no prompt (null on both), each maintenance launcher (triage, sweep), a recut and the estate check — shown by a throwaway comparison script whose output is pasted in the PR, the script not committed.
- [ ] Repo preselection is unchanged: the web link carries `repo=owner%2Fname&mode=plan`, the terminal link `repo=owner/name`.
- [ ] `lib/tickets.ts` no longer contains `newSessionUrl`, `claudePromptUrl`, `PROMPT_MAX_ENCODED_CHARS` or any `claude.ai/code/new` / `claude-cli://` literal; its five launcher exports keep their names and signatures.
- [ ] No file under `websites/admin-dashboard/components/` or `websites/admin-dashboard/app/` changes.
- [ ] The doc-citing comments (universal-link article, deep-links doc, the cap's rationale) survive in the target files, not rewritten.
- [ ] `websites/admin-dashboard/README.md` § Tickets names `lib/launchers/` as where the link builders live.
- [ ] CI is green (typecheck, lint, build) on the PR head.

## Out of scope

- Any model / effort parameter or the tier/effort derivation rule — stub 2 (`model-effort-preselect`); `LaunchHint` is declared but ignored.
- The split-button / dropdown UI and a target-aware component API replacing the wrappers — stub 3 (`launcher-dropdown`).
- Any non-Claude target (Codex, opencode, Hermes…) — future triage stubs, each citing its tool's documented link shape.
- Raising or otherwise changing the 4,500 cap, or the `branch` param of the universal link.

## Open questions

- none
