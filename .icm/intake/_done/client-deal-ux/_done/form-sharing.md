# Stub: Sending a form is one gesture

- feature-slug: form-sharing
- sequence: 5 of 5
- depends-on: profile-person-work-tabs
- priority: P2
- size: M

## What this is

Sharing a questionnaire today is create-then-hunt: pick a form, a link row appears,
open its fold, find the URL, copy it, go compose an email. Four ways in, all wanted
(Jamie's, 2026-08-29):

1. **Send-and-share in one gesture** — picking a form from the library
   (`send-form-control.tsx`) creates the link *and* immediately offers it: the
   share surface opens in the same interaction, no hunting through the new row.
2. **Share from every pending row** (`form-links.tsx`) — a share action on the row
   itself invoking the Web Share API (`navigator.share`) with a short message +
   the link; copy-link is the visible fallback wherever share isn't available
   (desktop browsers, mostly).
3. **Prefilled email draft** — a mailto link to the lead's address (when there is
   one) with subject and a short body carrying the form link, in the estate's
   quiet voice. Composed and sent by a human, per the standing rule — this only
   opens a draft.
4. **QR code** — the link as a QR for handing over in person, shown in a sheet
   from the row. Prefer a tiny dependency or hand-rolled generation over anything
   heavy; it renders one URL.

The pending fold keeps the raw URL (a link you can only share via buttons is a
link you can't check), but the fold stops being the only way to act. Answered
rows are untouched. All of it lives on the Work tab laid down by
`profile-person-work-tabs`.

## Prompt

Read `.icm/intake/client-deal-ux/breakdown.md` and
`.icm/intake/client-deal-ux/form-sharing.md` in the jamienisbet repo. Make form
sharing one gesture: creating a link immediately opens share, every pending row
carries share (Web Share API, copy fallback), a prefilled mailto draft to the
lead's address, and a QR code sheet for in-person handover.

Follow the `design-dna` skill. Verify on the Vercel preview on a phone-width
viewport (share sheet) and desktop (fallbacks), both colour modes. CI is the
source of truth — don't run builds locally. Work on a `claude/` branch, push,
open a PR, and `git mv` this stub to `.icm/intake/client-deal-ux/_done/` in that
PR.
