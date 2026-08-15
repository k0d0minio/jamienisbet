---
description: Check every estate repo against the .icm/.claude baseline, populate gaps from _system/template, then review each repo's .claude setup
allowed-tools: Bash(_system/scripts/icm-check.sh:*), Bash(/home/jamie-nisbet/Apps/_system/scripts/icm-check.sh:*), Read, Glob, Grep, Agent
---

# /icm-check — estate conformance: check, populate, review

Work from the Apps root. Sustentus-v2 is exempt throughout (its `pipeline/` is
authoritative). Never commit or push anything — leave created files uncommitted for
Jamie to review per repo.

## 1. Check

Run `_system/scripts/icm-check.sh` (no flags) and show the report.

## 2. Populate

If the check found gaps, run `_system/scripts/icm-check.sh --fix` and report what was created.

- The script only creates missing files from `_system/template/`; it never
  overwrites. Trust it — do not hand-create `.icm` or `.claude` files alongside it.
- Any prefix the script flags as *suggested* (auto-derived): list these prominently.
  Prefixes must be short, unique across the estate, and are never reused — if a
  suggestion collides or reads badly, tell Jamie which README to edit before the
  first ticket is cut. Do not invent tickets.

## 3. Review each repo's .claude and Layer 0

For every non-exempt repo the check listed, assess how well its Claude setup serves
that specific project — this estate deliberately does **not** enforce cross-project
consistency beyond the baseline, so judge each repo on its own terms:

- `CLAUDE.md` — exists? Thin Layer-0 that routes rather than teaches (house style:
  ~30–90 lines, identity + routing only)? Does it point at `.icm/intake/` for planning?
- `.claude/settings.json` — clean policy only? Anything that belongs in
  `settings.local.json` (the accretion layer)? Over-broad allows?
- Skills/hooks/agents — do the ones present still match the repo (dead references,
  drifted copies)? Would the repo genuinely benefit from one it lacks?
- Warnings from step 1 (loose TODO/BACKLOG files, gitignore problems) — fold them in.

Offload the per-repo reading to Explore subagents (batch several repos per agent);
keep the main context for the synthesis. Do not read `node_modules` or app source —
this is a config review, not a code audit.

## 4. Report

End with one section per repo needing attention: what was populated, what to improve,
each suggestion one line with the file it touches. Repos that are fine get one "ok"
line. **Suggest only — change nothing beyond what `--fix` created** unless Jamie asks.
