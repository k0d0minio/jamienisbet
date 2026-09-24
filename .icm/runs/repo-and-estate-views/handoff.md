# Handoff: repo-and-estate-views

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: smoke the admin preview (Vercel – jamie-nisbet, from PR #162's checks) on a phone
   and a desktop, light and dark: open a repo from its header (figures, client, launchers),
   tap a Blocked row in the overview, and — where one exists — a "Couldn't be read" repo row.
2. Operator: tick **Ready to merge** on https://github.com/k0d0minio/jamienisbet/pull/162.
3. Then `/pipeline release repo-and-estate-views`.

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** on
  https://github.com/k0d0minio/jamienisbet/pull/162

## Do not

- Do not tick either gate box.
- Do not change `lib/tickets.ts` or launcher/maintenance prompt shapes.
- Do not touch the `ticket-view`, `epic-view` or `keyboard-nav` stubs — other runs own them.
