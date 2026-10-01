# Stub: Evaluate pdfcn for the admin dashboard's first client-facing PDF

- lane: chore
- found-by: icm-board `notes/pdfcn.md` (tool research, verdict Pass / Watch for this dashboard) · 2026-10-01
- priority: P2
- sources: https://www.pdfcn.dev/docs · icm-board decisions D9 (markdown is canonical, the DOCX is
  a build artefact), D24 (one home per fact) and D31 (client status report)

## What this is

pdfcn is a shadcn-style set of copy-paste React components and blocks for generating PDFs,
installed with `npx shadcn@latest add @pdfcn/<renderer>/<component>`. It covers themed text,
tables, forms and whole-document blocks such as `invoice-minimal`, and offers one component API
over two renderers, Takumi and Forme. The copied code is ours, and there is no hosted
dependency.

The admin dashboard (`websites/admin-dashboard`, app.jamienisbet.com, Next.js 16) does not emit
any PDF today. The note gives two candidate first cases:

- the client status report (D31) as a download
- a quote summary

Some documents are explicitly not cases for pdfcn:

- **Invoices.** They live in Stripe, and Stripe renders them (D24).
- **Proposals and agreements.** icm-board renders these from markdown to DOCX, because
  clients redline Word (D9). A second renderer for them is out.

This stub decides whether pdfcn is the PDF tool for the dashboard **when one of those downloads
is actually specified**. Until then, it parks the evaluation.

## Prompt

Read this stub, then `websites/admin-dashboard/package.json` and the dashboard's shadcn setup
(`components.json` in the dashboard or in `packages/ui`).

1. Confirm a client-facing PDF download is actually wanted (status report or quote summary),
   and name it. If none is, move this stub to `triage/_done/` with a `> Dropped:` line and
   stop.
2. Resolve pdfcn's **licence**. The docs site states none and names no maintainer. Without a
   clear permissive licence it is a drop.
3. Compare it with `@react-pdf/renderer` on four points: Next.js 16 server rendering, bundle
   cost in the dashboard, fit with `packages/ui` tokens and theming, and how the copied
   components are kept up to date.
4. Recommend one renderer in this stub. Building the download itself is a separate stub cut
   from that recommendation.

Ship as a `claude/` branch and PR. The closing `git mv` to `triage/_done/` rides that PR.
