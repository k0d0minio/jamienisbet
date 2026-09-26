# Chore: seed-quality-workflow-rename

- invariant: behaviour unchanged; the advisory quality job runs exactly as before (same triggers,
  same path filters, same steps) — only the workflow file's name and internal labels differ.
- change: `.github/workflows/ci.yml` → `.github/workflows/quality.yaml` (`git mv`, content
  otherwise untouched except `name: CI` → `name: Quality` and the concurrency group `ci-*` →
  `quality-*` to match); `.icm/_shared/project-rules.md` → The factory: the advisory-job bullet
  now cites `quality.yaml`. `setup.sh` looks for `.github/workflows/quality.yaml`/`.yml` by name
  (§10 Workflows) and previously reported the job absent even though `ci.yml` already implemented
  the D43 shape (advisory, ready-heads-only, path-filtered, no `push: main`, no build step) —
  renaming closes that gap without changing what runs. `announce_from` is `session` (no UAT), so
  no `release.yaml` is owed — `setup.sh` already reports that absence as declared.
- rollback: `git mv` back to `ci.yml` and revert the two label edits; no data or schema involved.
- learned: none.
