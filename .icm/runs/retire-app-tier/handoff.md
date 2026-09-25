# Handoff: retire-app-tier

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. The operator smoke-tests the admin preview
   (https://jamie-nisbet-git-claude-intelligent-edison-2nxho8-kodominio.vercel.app), with real
   data, at a laptop and on the iPhone, in both appearances: every edit sheet and form
   (fields, selects, the draft and new-lead switches), a sheet's detent drag and dismiss, the
   keyboard taking the tallest detent, pull-to-refresh, a toast, login, `/money` by URL.
2. The operator ticks **Ready to merge** in the body of
   https://github.com/k0d0minio/jamienisbet/pull/182, then `/pipeline release retire-app-tier`.

## Blockers

- blocked on operator: smoke the preview and tick **Ready to merge** on
  https://github.com/k0d0minio/jamienisbet/pull/182

## Do not

- Do not tick Ready to merge, and do not merge before it is ticked.
- Do not change Stripe or Money server code, or put Money back in the navigation (D-17).
- Do not touch `websites/portfolio/`, `websites/sellers-site/` or the marketing tokens (D-22).
- Do not reintroduce an app-tier class or file; there are two tiers (BRAND.md § Desk tier).
