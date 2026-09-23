# Stub: `createClientRepo` scaffolds `.icm/` only — a new repo is born without root rails

- lane: tweak
- feature-slug: scaffold-root-rails
- sequence: found during the estate AGENTS.md rollout (icm-board epic `opencode-sidecar`,
  stub `estate-rollout`), 2026-08-30
- depends-on: none
- priority: P2
- size: S

## What this is

`scaffoldIcmBaseline` (`websites/admin-dashboard/lib/icm-scaffold.ts`) copies exactly one
folder into a freshly created client repo: `_system/template/icm/` → `<repo>/.icm/`. That
was the whole baseline when it was written, and it is why `createClientRepo` was checked
during the rollout at all — the question was whether it writes a `CLAUDE.md` that would
teach new repos the old shape. **It does not.** It writes no root file of any kind, so
nothing there had to change and no PR was widened.

What the check turned up instead is the other half of the same gap. The estate baseline
has since grown two canonical *root* assets — `opencode.json` and the one-line
`@AGENTS.md` importer `CLAUDE.md` (icm-board `_system/template/root/`, seeded by
`icm-check.sh --fix`) — and the scaffold does not know about them. A repo created from the
dashboard therefore lands with a correct `.icm/` and no rails at all: no OpenCode
permissions, no Layer 0 import, and no `.claude/` either. It shows up on the Tickets board
correctly and reports as a conformance gap the moment anyone runs `icm-check.sh` over it.

The scaffold's own comment already names the trade it is making — the template is read
over the contents API at call time so "an edit to the template reaches the next repo
created, with no redeploy here." Root assets would ride the same mechanism: read
`_system/template/root/` alongside `_system/template/icm/`, commit each file at the repo
root, keep the never-overwrite rule (`commitRepoFile` already refuses an existing path).

Two things to settle before writing it, both judgement rather than code:

- **`AGENTS.md` itself is deliberately never templated** — each repo writes its own Layer
  0. So a scaffolded repo would carry the importer pointing at a file that does not exist
  yet, which `icm-check.sh` calls out as *worse* than no importer ("Layer 0 resolves to
  nothing"). Either the scaffold seeds a minimal placeholder `AGENTS.md` from the client's
  own name and deal, or it seeds `opencode.json` only and leaves both identity files to
  `/project` adoption. The second is cheaper and matches the estate's "never fabricate
  intent" instinct; the first is the only one that makes a new repo conformant on day one.
- **Whether `.claude/` belongs in the scaffold too.** Same argument, larger surface, and
  it has been missing since the split without anyone minding — which is evidence about how
  much it matters.

## Worth knowing

Nothing is broken today: `/project` adoption and `icm-check.sh --fix` both close the gap
by hand, and every repo currently in the estate got its rails that way. This is about the
one moment we know a repo has just come into existence with nothing in it — the scaffold's
own stated reason for existing.
