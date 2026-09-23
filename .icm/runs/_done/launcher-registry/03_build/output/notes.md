# Build notes: launcher-registry

- commits: bafa1c2 feat: launcher-registry — extract the session-link registry · 2bc13e8 merge origin/main · 4cb751c chore: build notes
- ci: GREEN on 4cb751c (full gate, ready) — Typecheck + lint, three app builds, previews jamie-nisbet + portfolio

## What changed

- `websites/admin-dashboard/lib/launchers/types.ts`: `LaunchMode`, `LaunchHint` (declared, ignored), `LaunchRequest`, `LaunchTarget`, and `encodePrompt()` — the one `encodeURIComponent` + cap check both targets share.
- `lib/launchers/claude-terminal.ts`: the `claude-cli://` target and `CLAUDE_PROMPT_MAX_ENCODED_CHARS = 4500` with its rationale comment — it lives here because the terminal doc is where the 5,000 limit comes from; the web target imports it (the web doc documents none).
- `lib/launchers/claude-web.ts`: the universal-link target; `mode` now comes from the request (every caller passes `plan`, so the string is unchanged).
- `lib/launchers/index.ts`: `LAUNCH_TARGETS` (web, terminal), `DEFAULT_TARGET_ID`, `getTarget`, `launch` (throws on an unknown id); the "documented URL vs guess" section comment moved here.
- `lib/tickets.ts`: `newSessionUrl`, `claudePromptUrl`, `PROMPT_MAX_ENCODED_CHARS`, `encodedTicketPrompt` removed; `claudeSessionUrl` / `claudeTerminalUrl` wrap `launch()` (`string | null`); maintenance launchers use `authoredPromptUrl` (total, throws if a literal is ever edited past the cap).
- `README.md` § Tickets and the `lib/` tree: the builders now live in `lib/launchers/`.

## Acceptance criteria status

- [x] `lib/launchers/` holds the four files; `index.ts` exports `LAUNCH_TARGETS` (web first), `DEFAULT_TARGET_ID = "claude-web"`, `getTarget`, `launch`.
- [x] Byte-identical: a throwaway probe (Node type-stripping, `server-only`/`react`/`@jamie-nisbet/services` stubbed) printed all 15 cases from the pre-change `tickets.ts` and from the new one — `diff` empty, both outputs sha256 `50235f08…7b75`. Cases: short / verb / under-cap (4,500 encoded) / over-cap (4,501) / no-prompt on web and terminal, triage, sweep, recut, estate check. Output pasted on the PR.
- [x] Repo preselection unchanged — `repo=k0d0minio%2Fjamienisbet&mode=plan` (web), `repo=k0d0minio/jamienisbet` (terminal) in the proof.
- [x] `lib/tickets.ts` has no `newSessionUrl` / `claudePromptUrl` / `PROMPT_MAX_ENCODED_CHARS` / `claude.ai/code/new` / `claude-cli://`; five exports keep names and signatures.
- [x] No file under `components/` or `app/` changed.
- [x] Doc-citing comments moved; the one sentence that stopped being true ("Takes the prompt already encoded…") was dropped, the cap comment's "both ticket builders" now reads "both Claude targets".
- [x] README § Tickets names `lib/launchers/`.
- [x] CI green — full gate on 4cb751c.

## Notes for Release

- The maintenance launchers now pass through the 4,500 cap (they had none); all four are far under it (proof shows URLs), and a future over-long literal throws at render instead of emitting a link. That is the spec's decision, not a drift.
- `build()` references the cap constant rather than `this.maxEncodedPromptChars`, so a target's `build` survives being passed detached.
- `security-check.sh --branch` reports `BLOCKED 1` on dependency-audit: the 27 pre-existing transitive advisories already parked in `.icm/intake/triage/dependency-advisories-high-critical.md` (this branch touches no manifest). Recorded and resolved in `error.log`; not this run's to fix.

## Release

- gate: Ready to merge ticked — merge authorised
- ci: GREEN on 0a271e4 before the record (ci-status.sh); re-read on the final head below the close-out
- reviews: code medium (/code-review — no finding in this diff; one pre-existing finding from #137 parked) · security security-check.sh --branch --audit: OK after merging origin/main (#143 cleared the 27 advisories; the first read was BLOCKED on them, no waiver used) + /security-review n/a — no auth, payments, PII or route policy touched · readiness env.sh audit --changed: OK
- parked: owned-repos-sweep-page-cache-drift.md
- migrations: skip — none of this run's own
- learned: none (retrospective: the one error class is already a rule)
- docs: websites/admin-dashboard/README.md § Tickets (updated in Build; no docs tree) · announce: internal
