# References — Project-Specific Reference Material

> **ICM role:** Layer 3 — reference
> **Purpose:** Hold the stable, per-project context that every stage of *this* engagement reads but does not change: client brand-to-apply, tech-stack decisions, and links to the signed scope.

## What this folder accomplishes
When `_template-project/` is copied to `projects/<client>/`, this folder is filled once with everything the three stages need to stay consistent for this specific client. It is the project-local slice of Layer 3: it does not replace the global factory references in `_config/` and `shared/`, it *pins* the choices that apply only to this engagement (e.g. "use the client's brand, not Jamie's", "Next.js + Vercel + Supabase", "scope signed 2026-06-10"). Stages read from here so an agent loads only what this project needs (Principle 3: layered context loading).

## How it connects to the architecture
- **Upstream / reads from:** `_config/brand/` (whose brand applies — Jamie's by default, the client's if specified), `shared/clients/<client>/` (client facts), and the accepted proposal in `workspaces/proposals/`.
- **Downstream / feeds:** all stages in `../stages/` (`01_discovery/`, `02_build/`, `03_delivery/`) read this for brand + stack consistency.
- **Draws on (Layer 3 reference):** `_config/brand/visual/`, `_config/brand/voice/`, `_config/conventions/`.

## Contents
- `brand-to-apply.md` — which visual identity + voice this deliverable uses (default Jamie's `_config/brand/`; override if client-branded).  *(planned)*
- `tech-stack.md` — chosen stack, hosting, and key architecture decisions for this project.  *(planned)*
- `scope-link.md` — pointer to the signed proposal/scope in `workspaces/proposals/`.  *(planned)*

## Notes
Reference here is stable *within a run* — set it at copy time, change it only by deliberate decision (and re-flag downstream stages if you do). It is the project's recipe, not its ingredients; the changing per-run artifacts live in the stage `output/` folders and the project `../output/`.
