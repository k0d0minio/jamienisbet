# Gates

A gate is a checkbox in the body of the run's pull request. Only the operator ticks a gate.
An agent reads a gate. An agent never ticks, edits or removes a gate box.

The operator ticks Ready to merge in one of two ways:
- in the pull request on GitHub, or
- with the button "Tested, tick it" on the gate card of the BAXTER HUD. The HUD then
  ticks that one box. The press is the operator's act.

To show the gate card, run `~/jarvis_system/bin/baxter_gate.py card <number>` in the repo,
if that file exists. The card shows the summary, the section How to test of `handoff.md`,
the checks, and a link to the preview. BAXTER says the first words of How to test.

After the tick, the card has the button "Merge now". It runs the Release stage
(`release.sh`) for that pull request. The tick does not merge. Release merges.

## The two gates
| Gate | Anchor in the pull request body | Meaning of the tick |
|---|---|---|
| Spec approved | `<!-- gate:spec-approved -->` | Build can start |
| Ready to merge | `<!-- gate:ready-to-merge -->` | The operator tested the change. The merge is authorised |

The gate is the first checkbox line below its anchor.

- A spine run (Define, Build, Release) has both gates.
- A lane run (bug, tweak, chore) has only Ready to merge.
- A missing anchor means "not required". It does not mean "not ticked".

## How to read a gate
Run `.icm/_system/scripts/resolve-run.sh <ticket>`. It prints `spec_approved:` and
`ready_to_merge:` with the value `yes`, `no` or `none`. Do not read a gate from memory or
from chat. If the operator says "approved" and the box is not ticked, say that the box is
not ticked and give the pull request link.

## What enforces a gate
- Build stops when `spec_approved` is not `yes`.
- `release.sh` and `merge.sh` refuse when `ready_to_merge` is not `yes`.
- The CI job `icm-gate` fails while Ready to merge is not ticked. The repo ruleset
  requires that job, so GitHub refuses the merge too.

`ci-status.sh` does not count `icm-gate`. A pull request that waits only for the tick
is GREEN.