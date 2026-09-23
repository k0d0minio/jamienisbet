# Spec: Preselect model and effort on the launch link

- slug: model-effort-preselect
- personas: operator
- touches: websites/admin-dashboard/lib/launchers, websites/admin-dashboard/lib/tickets.ts, websites/admin-dashboard/components/ticket-detail.tsx, websites/admin-dashboard/components/batch-row.tsx, websites/admin-dashboard/app/(app)/tickets/page.tsx, websites/admin-dashboard/README.md
- complexity: standard

## Problem

A session launched from the Tickets board opens on whatever model and effort the composer last
held, and — because every launcher passes `mode=plan` — asks to start in plan mode, which Jamie
never wants from the board. Neither Anthropic link doc (universal link: `q`, `repo`, `branch`,
`mode`; deep link: `q`, `cwd`, `repo`) documents a model, effort or environment parameter, so the
board can't assume one exists (breakdown decision 3). This advances the session-launchers epic's
aim: one tap from the board opens a session already set up for the work, on any tool the registry
later carries (decisions 1–2).

## Proposed change

1. **`code` mode everywhere (decision 6).** Every launcher — ticket rows, batches, maintenance
   (triage, sweep), recut, estate check — sends `mode=code` explicitly (not dropped, so a sticky
   plan pick is never inherited). The terminal target still carries no `mode`. Repo preselection
   is unchanged (decision 4).
2. **Spike, run in Build.** Build produces the exact test URLs for `model`, `effort` and
   `environment` (obvious spellings) on `claude.ai/code/new` (desktop browser; iOS/Android via
   the universal link) and `claude-cli://open`, stops, and asks Jamie to test them and report.
   Outcome per surface × parameter: *honoured / ignored / breaks the link*, checked in the
   composer's pickers, not just that the page loads. Nothing is wired on an assumption.
3. **Derivation — one tool-neutral rule (decision 2).** `lib/launchers/hint.ts` exports
   `hintForTicket(ticket)` and hints for the maintenance / recut / estate-check launchers,
   returning a `LaunchHint` (`tier` + `effort`) from one tunable constant. No new stub fields.
   - **Verb pick-ups (repos on the `/pipeline` router) follow the pipeline's own tiering**
     (`select-model.sh`): `/pipeline new …` (Define, the advisor) → `deep`; `/pipeline build|release
     …` and every lane verb (executor) → `balanced`. Effort: an epic stub by `size` S → medium,
     M → high, L → xhigh; a triage stub by lane chore → low, tweak → medium, bug → high; a run in
     flight → high; no size → high.
   - **Prompt-body pick-ups (repos without the router) use the stub's table**: triage chore →
     balanced/low, tweak → balanced/medium, bug → deep/high; epic stub size S → balanced/medium,
     M → deep/high, L → deep/xhigh; anything else or no size → deep/high.
   - **Maintenance**: triage, sweep → balanced/medium; recut, estate check → deep/high.
   - `size` values normalise across `S/M/L` and `small/medium/large`, case-insensitive.
   - Each Claude target maps tier to a model **alias**: `fast → haiku`, `balanced → sonnet`,
     `deep → opus` — never a dated model ID.
4. **Where the hint goes.** A target whose `supports.model` / `supports.effort` is true (only
   after the spike marks that parameter *honoured* on that target's surface) puts it in its URL.
   Otherwise it stays out of the URL: the ticket detail and the batch sheet show the
   recommendation next to **Start in Claude Code** (e.g. "Opus · high"), per `design-dna`; and
   when the pick-up is a prompt body — never a `/pipeline` verb — one short line naming the
   recommendation is prepended to the prompt, counted against the 4,500 encoded-char cap.
5. **README § Tickets** records the spike table dated and flagged *verified by hand, not
   documented*; replaces the `mode=plan` lines with `mode=code`; and states that the cloud
   environment comes from the claude.ai/code selector (or the org default), not the link.

## Acceptance criteria

- [ ] Every web launch URL the board emits (ticket row, batch, triage, sweep, recut, estate check) ends in `&mode=code`; none contains `mode=plan`; the terminal URL carries no `mode`.
- [ ] Apart from `mode` and any spike-honoured parameter, every URL is byte-identical to today's, including `repo=owner%2Fname` on the web link and the literal slash on the terminal link.
- [ ] `lib/launchers/hint.ts` exports `hintForTicket` and the maintenance hints, driven by one constant that reproduces the tables above for verb pick-ups, prompt-body pick-ups and maintenance launchers.
- [ ] `S`/`small`, `M`/`medium`, `L`/`large` (any case) resolve to the same hint; a missing or unknown size resolves to `high` effort.
- [ ] The Claude targets map `fast/balanced/deep` to `haiku/sonnet/opus` aliases; no dated model ID appears in the launcher code.
- [ ] The spike's per-surface × per-parameter table (model, effort, environment; honoured / ignored / breaks) is in README § Tickets with its date, marked verified by hand; each target's `supports.model` / `supports.effort` matches that table.
- [ ] A parameter not marked honoured never appears in any emitted URL; `environment` is not wired unless observed honoured.
- [ ] The ticket detail and batch sheet show the recommendation (model alias · effort) next to **Start in Claude Code** whenever the default target does not carry it in the URL.
- [ ] For a prompt-body pick-up, the prompt sent starts with one line naming the recommendation; a `/pipeline` verb pick-up is sent unchanged.
- [ ] The prepended line counts toward the 4,500 cap: a prompt that fits only without it falls back to **Copy prompt** (and the copied text matches what the link would have sent); authored maintenance prompts still never exceed the cap.
- [ ] README § Tickets says every launcher passes `mode=code` and that the environment comes from the claude.ai/code selector or org default, not the link.

## Out of scope

- The launcher dropdown / other tools (stub 3, `launcher-dropdown`; decision 5).
- Any new stub dash-line for model or effort (decision 2).
- Showing the recommendation on board rows or maintenance buttons (detail and batch sheet only).
- Reading a run's `complexity` from its spec to tier `build`/`release` as `deep` — the board doesn't read specs; runs in flight are `balanced`.
- Preselecting the cloud environment by any means other than a spike-honoured parameter.

## Open questions

none
