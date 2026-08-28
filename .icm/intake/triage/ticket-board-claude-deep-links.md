# Stub: Point the board's "Start in Claude Code" at the documented deep-link shapes

- lane: tweak
- found-by: research session, 2026-08-28 (asked whether every ticket could carry an
  "open in Claude Code" button)
- priority: P2
- size: S
- sources:
  https://code.claude.com/docs/en/deep-links ·
  https://support.claude.com/en/articles/14898120-open-the-claude-mobile-app-with-a-link ·
  https://github.com/anthropics/claude-code/issues/19023 (closed, not planned)

## What was found

The button already exists. Every ticket row on the board renders **Start in Claude Code**
beside **Copy prompt** (`websites/admin-dashboard/app/(app)/tickets/page.tsx`), and the URL
is built by `claudeSessionUrl()` in `websites/admin-dashboard/lib/tickets.ts`:

```
https://claude.ai/code?prompt=<encoded>&repositories=<owner/name>
```

The research turned up three link families, and the board is on the one Anthropic has never
documented:

| Shape | Opens | Documented |
|---|---|---|
| `claude.ai/code?prompt=…&repositories=…` | the web new-session form | **no** — the feature request for it ([#19023](https://github.com/anthropics/claude-code/issues/19023)) was closed *not planned* |
| `claude.ai/code/new?q=…&repo=…&branch=…&mode=…` | the mobile app's new-session composer via universal link; the browser when the app isn't installed | yes, the support article above |
| `claude-cli://open?repo=…&q=…` (or `cwd=`) | a **local terminal** session, prompt pre-filled, nothing sent until Enter | yes, `code.claude.com/docs/en/deep-links` |

So the current link is an undocumented, unversioned param shape that can change under us
without notice, and it is the wrong one for the surface this board was built for: the
dashboard is mobile-first and the Tickets screen's own comment says "the one action that
matters on a phone is Copy prompt / the one-tap Claude session". `/code/new` is the
universal link — it hands the tap to the installed app and falls back to the browser.

Four smaller gaps in `claudeSessionUrl()` while it is open:

- **No length cap.** `ticket.prompt` is a ticket's whole `## Prompt` section, unbounded.
  The terminal scheme documents a 5,000-character ceiling on `q`, and browsers cap total
  URL length well below what a long stub can produce — a long prompt can silently truncate.
  Cap it, and fall back to Copy prompt (already right there) past the limit.
- **No `branch`.** Follow-up work on an existing `claude/` branch can't preselect it.
- **No `mode`.** A big stub usually wants `mode=plan`, not `code`.
- **No terminal escape hatch.** `claude-cli://open?repo=…&q=…` is the desk-bound twin of
  the same tap; the board is our own HTML, so the custom scheme renders fine here (it is
  only GitHub-rendered markdown that strips it).

Nothing here is broken today — the button works as built. This is a durability and
mobile-fit tweak, not a bug.

## Prompt

Read `.icm/intake/triage/ticket-board-claude-deep-links.md` first — it carries the
research this is based on, including the three deep-link shapes and their sources.

In `websites/admin-dashboard`, rework `claudeSessionUrl()` in `lib/tickets.ts` and its one
caller in `app/(app)/tickets/page.tsx`:

1. Switch the primary link from the undocumented `claude.ai/code?prompt=…&repositories=…`
   to the documented universal link `https://claude.ai/code/new?q=…&repo=…`. Params are
   `q` (the prompt), `repo` (one `owner/name`), optional `branch` (requires `repo`) and
   optional `mode` (`plan` | `code`). URL-encode every value. Pass `mode=plan` — these
   stubs are picked up by planning first, not by editing.
2. Cap the encoded prompt. Return `null` (or a flag the row can read) past a sane ceiling
   — the terminal scheme documents 5,000 characters for `q`, so stay under that — and let
   the row fall back to **Copy prompt** alone with a one-line reason, rather than emitting
   a URL that truncates without saying so.
3. Add a second, secondary action next to it: `claude-cli://open?repo=<owner/name>&q=<same
   prompt>` — "Open in terminal". Same prompt, same cap, opens a local session in whichever
   clone that machine last ran `claude` in. It is inert until Enter is pressed, so it is
   safe as a plain `<a href>`; style it as the quiet sibling of the primary button, not a
   third equal button.
4. Keep the shapes in one place. Both builders live in `lib/tickets.ts` beside each other
   with a comment naming the doc each one comes from, so the next person can tell the
   documented shape from a guess.

Verify by hand before opening the PR — none of this can be unit-tested against Anthropic's
routing. Push, wait for the Vercel preview, then on a phone with the Claude app installed
tap **Start in Claude Code** on a real ticket and confirm the composer opens with the
prompt in the box and the repo selected; then tap the same link in a desktop browser and
confirm the web form prefills. If `/code/new` turns out to prefill worse than the current
`?prompt=&repositories=` shape on the desktop web, say so in the PR and keep the old shape
as the desktop path rather than regressing it — the mobile tap is the one that has to work.

Update the **Tickets** section of `websites/admin-dashboard/README.md`, which currently
documents the `claude.ai/code?prompt=…&repositories=…` shape by name.

Do not touch the ticket parser, the board's grouping, or anything else on the screen. When
the work is done, `git mv` this stub to `.icm/intake/triage/_done/`.
