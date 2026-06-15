# Brand Assets — Exported Production Files

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the production-ready exported files (logos, favicons, social avatars, letterhead) that websites and documents embed directly.

## What this folder accomplishes
This is the binary/output side of the brand: the finished, ready-to-embed files that render the rules defined in `visual/` and `voice/`. Websites pull favicons and logos from here; document templates pull the letterhead and logo marks from here so a proposal or invoice carries the same identity as the website. Keeping all exported assets in one place means there is exactly one correct logo file, one favicon set, and one letterhead — no stray, outdated copies scattered through the repo.

## How it connects to the architecture
- **Upstream / reads from:** the spec in [`_config/brand/visual/`](../visual/) (assets are exported to match those tokens).
- **Downstream / feeds:** [`websites/`](../../../websites/) (logos, favicons), [`shared/templates/`](../../../shared/templates/) (letterhead, logo marks for PDFs), social profiles and avatars.
- **Draws on (Layer 3 reference):** [`_config/brand/visual/`](../visual/), [`_config/brand/voice/`](../voice/).

## Contents
*(Describe only — create NO asset files here.)*
- `logo/` — primary logo in svg + png, light/dark variants, horizontal + stacked lockups.  *(planned)*
- `favicon/` — favicon set (ico, png sizes) and web app icons.  *(planned)*
- `social/` — square social avatars and banner images sized per platform.  *(planned)*
- `letterhead/` — document header/footer assets for proposals, quotes, contracts, invoices.  *(planned)*

## Notes
The spec now exists in [`visual/`](../visual/) (tokens, type, logo brief) — these asset files are still to be produced against it. Until a logo is designed, use the interim wordmark from [`visual/logo.md`](../visual/logo.md). Assets are downstream of the spec: never edit a token by editing an exported file. If [`visual/`](../visual/) changes, re-export every affected asset here so the website and documents stay in sync. Name files by variant and intent (e.g. `logo-horizontal-dark.svg`) so both Claude and a human can pick the right one without guessing.
