# JN-029 · Untrack barzinho's P&L PDFs

| | |
|---|---|
| Status | ready |
| Type | security |
| Priority | P0 |
| Size | S |

## Problem

`_system/AUDIT.md` open security P0: barzinho's P&L PDFs are git-tracked — the
`.gitignore` pattern stopped matching after the files moved to
`shared/profit-and-loss/`. Work happens in `projects/barzinho` (a separate repo, on this
machine only).

Scope is deliberately split: untrack + pattern fix are unambiguous and go now. A
**history scrub** is gated on audit decision #7 (is the barzinho deal still live?) and
on whether the repo has a remote — surface both answers to Jamie; do not rewrite history
unprompted.

## Acceptance

- [ ] PDFs untracked (`git rm --cached`), `.gitignore` pattern matches the new path,
      status clean
- [ ] Whether a remote exists (and therefore scrub urgency) reported to Jamie
- [ ] AUDIT.md updated: untrack done; scrub decision still open under decision #7

## Prompt

Untrack the git-tracked P&L PDFs in the barzinho client repo. Read
.icm/intake/JN-029-untrack-barzinho-pnl-pdfs.md for full context. Work in
projects/barzinho (local machine only): git rm --cached the PDFs under
shared/profit-and-loss/, fix the .gitignore pattern, commit in that repo, and report
whether the repo has a remote so Jamie can decide on a history scrub — do not rewrite
history yourself. Update _system/AUDIT.md's security section in this repo (doc-only
commit straight to main).
