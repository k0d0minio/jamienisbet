# icm-template — canonical scaffold for estate conformance

This is the template `_system/icm-check.sh --fix` copies from when a repo is missing
its `.icm/` or `.claude/` baseline. Sustentus-v2 is exempt (its `pipeline/` is
authoritative).

```
icm/                     → copied to <repo>/.icm/
  intake/
    README.md            ← micro-copy of TICKETS-SPEC.md; {{PREFIX}} is substituted
    _done/.gitkeep
  docs/.gitkeep          ← ad hoc reports land here (estate convention)
claude/                  → copied to <repo>/.claude/
  settings.json          ← clean policy only: schema + secrets deny-list
```

Rules:

- **Never overwrite.** The script only creates what's missing; existing files win.
- **Prefix resolution** when creating `intake/README.md`: existing tickets in the repo
  → the known-prefix map in `icm-check.sh` → derived from the repo name (flagged as
  *suggested* — confirm before cutting the first ticket, numbers are never reused).
- **No hooks in the `.claude` template** — hook strategy is an open estate decision
  (README.md § Decisions #3). The global `~/.claude` layer carries hooks locally;
  revisit when that decision lands.
- Template edits here propagate only to repos fixed *after* the edit; the script never
  retro-syncs existing files. That is deliberate — repos own their copies.
