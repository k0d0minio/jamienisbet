# Stub: Preselect model and effort on the launch link

- feature-slug: model-effort-preselect
- sequence: 2 of 3
- depends-on: launcher-registry
- size: M

## What this is

A launched session should open on a model and effort that fit the work. Jamie's call:
the recommendation is **derived, never authored** — no new stub fields. Two halves.

### 1. Spike — what can a link actually carry?

Neither Anthropic doc lists a model or effort parameter (universal link: `q`, `repo`,
`branch`, `mode`; deep link: `q`, `cwd`, `repo`). Verify by hand, on each surface, and
write down what happened:

- `claude.ai/code/new?…&model=…` and `…&effort=…` — desktop browser, and the iOS/Android
  app via the universal link. Try the obvious spellings; check the composer's model and
  effort pickers, not just that the page loads.
- `claude-cli://open?…&model=…` / `&effort=…` — does the handler pass them to the CLI?

Outcome per surface × parameter: **honoured / ignored / breaks the link.** Record the
table (with the date) in `websites/admin-dashboard/README.md` § Tickets, flagged as
verified by hand, not documented — the house distinguishes the two. Only *honoured*
parameters get wired, by flipping that target's `supports.model` / `supports.effort`.

### 2. Derivation — one rule, tool-neutral

`lib/launchers/hint.ts` exports `hintForTicket(ticket)` and a per-launcher hint for the
maintenance / recut / estate-check prompts, returning a `LaunchHint` (`tier` + `effort`).
Each target maps `tier` to its own model name (Claude: `fast → haiku`, `balanced →
sonnet`, `deep → opus` — aliases, not dated model IDs, so they don't rot).

Starting table (one constant, tune freely; `size` values in the estate include
`S/M/L` and `small/medium/large` — normalise):

| Ticket | Tier | Effort |
|---|---|---|
| triage, `lane: chore` | balanced | low |
| triage, `lane: tweak` | balanced | medium |
| triage, `lane: bug` | deep | high |
| epic stub, `size` S | balanced | medium |
| epic stub, `size` M | deep | high |
| epic stub, `size` L | deep | xhigh |
| anything else / no size | deep | high |
| maintenance: triage, sweep | balanced | medium |
| recut, estate check | deep | high |

### 3. Where the hint goes

- A target that supports the parameter: into the URL.
- A target that doesn't: nowhere in the URL. The UI shows the recommendation next to the
  button (e.g. "Opus · high") so it can be picked by hand in the composer. When the
  pick-up is a prompt body (not a `/pipeline` verb — never touch a verb), prepend one
  short line naming the recommendation, counted against the 4,500 cap.

### 4. Launch in `code` mode, never `plan` (Jamie, 2026-09-23)

Every launcher passes `mode=plan` today (`lib/tickets.ts` wrappers, `mode: "plan"`). Jamie
never wants a board session to start in plan mode: switch every launcher — ticket rows,
batches, maintenance, recut, estate check — to `mode: "code"`. `code` is a documented value
of the universal link's `mode` (support.claude.com/en/articles/14898120: "Pre-selects the
session mode. Accepts `plan` or `code`."); send it explicitly rather than dropping the
param, so the session never inherits a sticky plan pick. The terminal target carries no
`mode` and is unaffected. Update the README § Tickets lines that say "Every launcher passes
`mode=plan`".

Observed on production by Jamie (2026-09-23), for the spike to confirm: the repo **is**
preselected; the `mode=plan` value did not visibly take effect; the model did not appear
preselected.

### 5. Environment — not a link parameter (record, don't wire)

The cloud environment is **not** carried by any documented link. The universal link
documents `q`/`prompt`, `repo`, `branch`, `mode` only, and the cloud-environments doc says
of claude.ai/code: sessions "use the environment shown in the selector. An organization
default set by an Owner fills the selection when you haven't picked one" — "There's no
settings page or direct URL for the selector" (code.claude.com/docs/en/cloud-environments,
§ The Default environment). So the board cannot preselect it; the fix is operator-side:
pick the right environment once in the claude.ai/code selector (the pick sticks), or set it
as the org default at claude.ai/admin-settings/claude-code. Add `environment` to the spike's
"try the obvious spellings" list alongside `model`/`effort` for completeness, but wire it
only if it is observed to be honoured — and say in the README § Tickets that the
environment comes from the selector, not the link.

## Prompt

In this repo, make the admin dashboard's session links launch in `code` mode (never
`plan`), preselect a model and effort where the link supports it, and show the
recommendation where it doesn't. Read this stub
first — `.icm/intake/session-launchers/model-effort-preselect.md` — then
`.icm/intake/session-launchers/breakdown.md`, then `websites/admin-dashboard/lib/launchers/`
(built by the `launcher-registry` stub; confirm it has merged before starting).

1. Run the spike in the stub (model, effort, and environment — § 5). You can't tap a phone from a cloud session, so for any
   surface you can't test yourself, stop and ask Jamie to test the exact URLs you
   produce and report back. Don't wire anything on an assumption.
2. Add `lib/launchers/hint.ts` with the derivation table from the stub, and the
   tier → model-alias mapping inside each Claude target.
3. Wire only the parameters the spike marked *honoured*; set each target's
   `supports.model` / `supports.effort` to match. Everything else stays out of the URL.
4. Surface the recommendation on the ticket detail and batch sheet next to the start
   button; apply the one-line prompt prefix only to prompt bodies, never to a pipeline
   verb, and keep the 4,500 cap honest. Follow `.claude/skills/design-dna/SKILL.md`.
5. Switch every launcher to `mode: "code"` (§ 4) and update the README's `mode=plan` lines.
6. Record the spike table in `websites/admin-dashboard/README.md` § Tickets, marked as
   verified by hand on its date.

Don't run build/lint/typecheck locally — CI is the source of truth. Ship on a `claude/`
branch through a PR, and in that PR `git mv` this stub to
`.icm/intake/session-launchers/_done/`.
