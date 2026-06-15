# <NN — Stage Name> — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->
<!-- Schema: _config/conventions/stage-contracts.md. Replace every <…> placeholder. -->

## Inputs
- Layer 4 (working): `<previous-stage>/output/<run>/<file>.md` — or `human input` for stage 01.
- Layer 3 (reference): `<exact reference path(s) this stage loads, e.g. ../../references/...>`

## Process
<Plain-language description of the single job: what the agent reads, what it asks the human, the
transformation it performs. One job — if it is two, it is two stages.>

## Outputs
- `<deliverable>.md` -> `output/<client-or-run>/<vN>/`

## Integrations
- none   <!-- or: the script/MCP this stage may call, draft-only (see scripts-and-integrations.md) -->

## Verify
- <concrete cross-checks before the review gate — e.g. every setup field is filled; figures match
  the source input; tone matches _config/brand/voice/; no placeholder text remains.>

## Review gate
- <none | what the human edits/approves before the next stage runs. Client-facing → always a gate.>
