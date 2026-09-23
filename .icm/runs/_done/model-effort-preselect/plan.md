# Plan: model-effort-preselect

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **`code` mode** — `lib/tickets.ts` (`ticketLaunchUrl`, `authoredPromptUrl`: `mode: "code"`, comment above them), `lib/launchers/claude-web.ts` comment — done when: every web URL ends `&mode=code` and is otherwise unchanged.
2. **Spike (stop point)** — list the exact URLs: `claude.ai/code/new?q=hello&repo=k0d0minio%2Fjamienisbet&mode=code` plus each of `&model=opus`, `&model=claude-opus`, `&effort=high`, `&reasoning_effort=high`, `&environment=<name>`; the same on `claude-cli://open?repo=k0d0minio/jamienisbet&q=hello`. Stop, ask Jamie to test (desktop browser, iOS, Android, terminal) and report honoured / ignored / breaks per cell. Record the answer in `decisions.md` — done when: the table is filled.
3. **Derivation** — `lib/launchers/hint.ts`: one `HINT_RULES` constant; `hintForTicket(ticket)` (branches on `pickupKind` verb vs prompt, `kind` stub/run, batch `triage` vs epic, lane, normalised size — read from `meta` or surface `size`/`lane` on `Ticket` in `lib/tickets.ts`), and maintenance hints keyed `triage|sweep|recut|estate-check`. A `TIER_ALIAS` map per Claude target — done when: the spec's tables are reproduced by the constant.
4. **Wiring** — `LaunchRequest.hint` passed by the wrappers; each target sets `supports.model/effort` from the spike and appends only honoured params in `build()`; prompt-body prefix line (e.g. `Recommended: Opus · high effort`) prepended before encoding, so the cap check covers it; `Copy prompt` copies the same text — done when: no un-honoured param in any URL, verbs untouched, cap still honest.
5. **UI** — `components/ticket-detail.tsx` and the batch sheet (`components/batch-row.tsx`, fed from `app/(app)/tickets/page.tsx`): a quiet label beside **Start in Claude Code** when the default target doesn't carry the hint; follow `.claude/skills/design-dna/SKILL.md` and `packages/ui/BRAND.md` — done when: both surfaces show "Opus · high"-style text.
6. **README § Tickets** — link table `mode=code`, the dated spike table flagged verified-by-hand, the hint rule in a sentence, and the environment-from-selector line — done when: no `mode=plan` left in README.

## Risks

- A web param that "loads fine" but is ignored — the spike must read the composer's pickers, not just the page.
- The prefix pushing a near-cap prompt over 4,500 — signal: a ticket that had a Start link loses it; that is correct behaviour, but Copy prompt must still match.
- `size` absent or free-form in legacy tickets — falls to high effort; don't throw.
