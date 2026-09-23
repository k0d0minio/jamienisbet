# Build notes: model-effort-preselect

- commits: 98dc850 feat (code mode, hint rule, recommendation), + README/spike commit
- ci: GREEN on 5ad76db — full gate (ready), admin-dashboard + portfolio previews built

## What changed

- `lib/launchers/hint.ts` (new): `HINT_RULES` — one constant; `hintForTicket` (verb vs prompt-body tables, size normalised across S/M/L and small/medium/large), `hintForMaintenance`.
- `lib/launchers/types.ts`: `LaunchTarget.modelAliases`; `LaunchHint` comment.
- `lib/launchers/claude-terminal.ts`: `CLAUDE_MODEL_ALIASES` (haiku/sonnet/opus), shared by both Claude targets.
- `lib/launchers/claude-web.ts`: `mode=code` comment; model/effort documented as not carried; `supports` unchanged (false/false) per the spike.
- `lib/launchers/index.ts`: re-exports the hint API; `carriesHint`, `hintLabel`, `withHintLine`.
- `lib/tickets.ts`: every launcher `mode: "code"`; `Ticket.hint`; `withLaunchHint` sets the hint and prefixes prompt-body pick-ups (so Copy prompt and the link carry the same text and the cap measures it); maintenance launchers pass their kind and get the prefix too.
- `components/ticket-detail.tsx`: "Recommended <mono>Opus · high</mono>" beside Start in Claude Code.
- `README.md` § Tickets: `mode=code`, the hint rule, the environment-from-selector line, the dated hand-verified spike table.

## Acceptance criteria status

- [x] `&mode=code` on every web URL, no `mode=plan`, terminal has no `mode` — `ticketLaunchUrl` and `authoredPromptUrl` both pass `"code"`; the terminal target never read it.
- [x] Byte-identical apart from `mode` — repo encoding untouched in both targets. Note: a prompt-body `q` now opens with the recommendation line, by criterion 9; verb `q`s are unchanged.
- [x] `hintForTicket` + maintenance hints from one constant (`HINT_RULES`).
- [x] Size normalisation (`normaliseSize`); missing/unknown size → high effort on both tables.
- [x] `CLAUDE_MODEL_ALIASES` — aliases only.
- [ ] Spike table in README § Tickets, dated 2026-09-23, flagged verified by hand; `supports.model/effort` false on both, matching it — **partly**: the table is per parameter, not per surface, because the result was reported as one sentence for all surfaces (D-5). Left unticked on the PR; the operator decides whether that is enough.
- [x] No un-honoured parameter in any URL; `environment` not wired.
- [x] Recommendation beside Start on the ticket detail, which is what the batch sheet renders (D-3).
- [x] Prompt bodies open with `Recommended: Opus · high effort.`; verbs untouched (`withLaunchHint` checks `pickupKind === "prompt"`).
- [x] Prefix applied before `launch()`, so the 4,500 cap counts it; Copy prompt copies `ticket.pickup`, the same prefixed text; authored maintenance prompts ~500 chars plus the line, far under.
- [x] README says `mode=code` and environment-from-selector.

## Notes for Release

- The spike was reported as one sentence, per parameter rather than per surface (D-5); the table does not claim more than that.
- `mode=code` was not seen to take effect, but is sent because it is the documented value (D-4).
- The prompt-line prefix now also rides on the maintenance prompts (triage, sweep, recut, estate check) — they are prompt bodies, and the spec's rule is "prompt bodies, never verbs".
