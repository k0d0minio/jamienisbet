# Plan: launcher-registry

Build's execution plan in passes — each pass one layer of the change, in the order it lands, so
a session that resumes mid-build sees where it is. Written by the advisor pass (Define, or
Build's first act on `sonnet` after reading the spec), executed pass by pass, and rewritten when
reality disagrees with it — never left describing a plan that was abandoned.

## Passes

1. **Baseline capture** — a throwaway script (scratchpad, never committed) that imports the
   current `lib/tickets.ts` builders and prints every URL listed in the spec's byte-identity
   criterion (short prompt, pipeline verb, just-under / just-over 4,500 encoded, no-prompt ticket,
   triage, sweep, recut, estate check; web + terminal where both exist) — done when: the
   baseline output is saved in the scratchpad.
2. **The module** — `lib/launchers/types.ts`, `claude-web.ts`, `claude-terminal.ts`, `index.ts`;
   the cap + its rationale comment in one shared place both targets import; comments moved
   verbatim — done when: `launch("claude-web" | "claude-terminal", req)` exists and nothing
   imports it yet.
3. **The wrappers** — `lib/tickets.ts`: delete `newSessionUrl`, `claudePromptUrl`,
   `PROMPT_MAX_ENCODED_CHARS`, `encodedTicketPrompt`; re-implement the five exports over
   `launch()` (ticket ones `string | null`, maintenance ones total, throwing on an impossible
   null); section comments point at `lib/launchers/` — done when: `lib/tickets.ts` has no
   `claude.ai/code/new` or `claude-cli://` literal and no component file is touched.
4. **Proof** — re-run the pass-1 script against the new code and diff against the baseline —
   done when: the diff is empty; the output goes in the PR (Steps to test / a comment).
5. **README** — `websites/admin-dashboard/README.md` § Tickets names `lib/launchers/` — done
   when: the link table's prose points at the new location.

## Risks

- The terminal target double-encodes or encodes `repo` (today it is literal `owner/name`) — the
  pass-4 diff shows it.
- Cap semantics drift: the web link documents no cap but inherits 4,500 today; it must stay 4,500
  on both targets — the just-over case returns null on both.
- Maintenance wrappers becoming `string | null` would ripple into `page.tsx` — keep them total.
