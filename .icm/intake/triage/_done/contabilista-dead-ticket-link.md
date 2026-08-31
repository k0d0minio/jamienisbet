# Stub: The contabilista README links to a ticket file that no longer exists

- lane: chore
- found-by: closing `intake-docs-stale`, 2026-08-30
- priority: P2
- size: S

## What this is

`.icm/docs/contabilista/README.md:27` ends the compliance-calendar paragraph with
"once confirmed it feeds [`JN-027`](../../intake/JN-027-seed-compliance-calendar.md)
and the dashboard's `biz.compliance_dates`". No `JN-*` file survives anywhere under
`.icm/intake/` — the numbered series went with the pre-2026-08-28 contract — so the
link is dead and the reader is pointed at work with no ticket behind it.

The work itself may still be real: seeding `biz.compliance_dates` from §5 of document
02 once Jamie's contabilista confirms the calendar. That is what needs deciding —
whether to re-cut it as a stub (and if so, its own epic or triage) or to rewrite the
sentence to describe the pending step without pretending a ticket tracks it.

Left out of the `intake-docs-stale` PR on purpose: that PR fixes docs that describe
the *contract*; this is a docs link to a retired ticket plus an open question about
whether the work still stands.
