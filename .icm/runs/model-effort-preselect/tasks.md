# Tasks: model-effort-preselect

The queue, with a definition of done per item. Ticked by the stage that finishes the item —
a human checkbox, never a script's. The definition of done is seeded from the spec's
acceptance criteria when the run is opened; the queue is Build's own, one line per commit-sized
step, so a resuming session can pick up the first unticked line.

## Definition of done

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

## Queue

- [ ] <task — small enough for one commit; name the file or area>
