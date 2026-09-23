# Handoff: model-effort-preselect

For the next session — human or agent — what to do first and what stands in the way.
Rewritten, not appended, at every stage stop; a stage that STOPs mid-way writes it before it
stops, so nothing is carried in anyone's head.

## Next steps

1. Operator: smoke the admin-dashboard preview on PR #144 — open a ticket on Tickets: Start in Claude Code opens with `mode=code`, "Recommended <model> · <effort>" sits beside it, a prompt-body ticket's "Sends" line opens with the `Recommended:` line, a `/pipeline` verb is unchanged.
2. Tick **Ready to merge** on PR #144, then `release model-effort-preselect`.

## Blockers

- none

## Do not

- Wire `model`, `effort` or `environment` into a URL — the 2026-09-23 hand test found them ignored (decisions.md D-1).
- Prefix a `/pipeline` verb. Tick a gate.
