# Chore: board-sends-bare-verb

- invariant: behaviour unchanged for a repo that already had the `/pipeline` skill file — it
  still sends a verb, just without the `/pipeline ` prefix (every repo's own router, skill or
  hook, reads the bare form). What changes: a repo the board couldn't confirm the skill file in
  (missing, private path, or the estate's routing hook shipped without the skill) now also gets
  the bare verb instead of the raw `## Prompt` body, and every ticket carries its `complexity:`
  line as a badge beside priority.
- change: `websites/admin-dashboard/lib/tickets.ts`: dropped `TicketRepo.pipeline`, `probeRouter`
  and its hourly discovery-clock call — `pickupOnly` no longer gates the verb form on a probed
  router file; it always forms `new <scope>/<slug>` / `<lane> <slug>` / `build|release <slug>`,
  falling back to the `## Prompt` body only where no verb can be formed (a triage stub with an
  unknown lane, a legacy flat ticket). The triage-stub form dropped the `.icm/intake/triage/`
  path prefix too — a bare slug, matching how `/pipeline`'s own "Resolving a lane argument" reads
  a single token. Parsed `- complexity:` from a stub's dash-lines (`low|medium|high|research`)
  into `Stub.complexity`/`Ticket.complexity`, alongside the existing `priority` parse.
  `components/ticket-reader.tsx`: `ReaderSummary` shows `ticket.complexity` beside the priority
  tag, the same way it already shows size. `lib/launchers/hint.ts`: reworded two comments that
  described the recommendation rule in terms of "the repo carries the /pipeline router" — the
  rule itself (keyed on `pickupKind`) did not change.
- rollback: no schema touched — a plain `git revert` of this PR restores the router probe and
  the `/pipeline`-prefixed, gated verb.
- learned: none (a build-time TS2367 from flattening the `repo.pipeline` gate is logged and
  resolved in `lane/output/error.log` — a consequence of this change, not a repo constraint)
