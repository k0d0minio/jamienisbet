# Tasks: launcher-registry

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

- [x] `websites/admin-dashboard/lib/launchers/` holds `types.ts`, `claude-web.ts`, `claude-terminal.ts` and `index.ts`; `index.ts` exports `LAUNCH_TARGETS` (two targets, web first), `DEFAULT_TARGET_ID = "claude-web"`, `getTarget` and `launch`.
- [x] Before/after, the URL strings are byte-identical for: a short stub prompt and a pipeline verb (web and terminal), a prompt just under and just over the 4,500 encoded-char cap (under → same URL on both; over → null on both), a ticket with no prompt (null on both), each maintenance launcher (triage, sweep), a recut and the estate check — shown by a throwaway comparison script whose output is pasted in the PR, the script not committed.
- [x] Repo preselection is unchanged: the web link carries `repo=owner%2Fname&mode=plan`, the terminal link `repo=owner/name`.
- [x] `lib/tickets.ts` no longer contains `newSessionUrl`, `claudePromptUrl`, `PROMPT_MAX_ENCODED_CHARS` or any `claude.ai/code/new` / `claude-cli://` literal; its five launcher exports keep their names and signatures.
- [x] No file under `websites/admin-dashboard/components/` or `websites/admin-dashboard/app/` changes.
- [x] The doc-citing comments (universal-link article, deep-links doc, the cap's rationale) survive in the target files, not rewritten.
- [x] `websites/admin-dashboard/README.md` § Tickets names `lib/launchers/` as where the link builders live.
- [ ] CI is green (typecheck, lint, build) on the PR head.

## Queue

- [x] Baseline: every launcher URL captured from the pre-change `lib/tickets.ts` (scratchpad probe, not committed)
- [x] `lib/launchers/` — types, claude-web, claude-terminal, index
- [x] `lib/tickets.ts` — five exports re-implemented over `launch()`
- [x] Proof: 15 URLs byte-identical before/after
- [x] `README.md` § Tickets + the `lib/` tree line
- [ ] Settle CI, flip ready, settle the full gate
