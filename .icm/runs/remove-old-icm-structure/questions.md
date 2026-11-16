### Q1. The workflow `ci.yml` only calls `legible-consulting/.github`. What happens to it?
- type: single
- options: Keep it as it is in this ticket | Replace it with a workflow of this repo in this ticket
- default: Keep it as it is in this ticket
- answer: Replace it with a workflow of this repo in this ticket

### Q2. The lane `hotfix` of before has no lane in the BAXTER blueprint. What happens to it?
- type: single
- options: Remove it, a production fault uses the lane bug | Keep the folder outside `_system/` as a repo file
- default: Remove it, a production fault uses the lane bug
- answer: Remove it, a production fault uses the lane bug

### Q3. The repo skills `pr-conventions` and `ticket-craft` send a session to `.icm/intake/CONTEXT.md` and `.icm/scripts/`. What happens to them?
- type: single
- options: Delete both, the rules of `.icm/_system/rules/` replace them | Rewrite both to point at `.icm/_system/rules/` | Keep both as they are
- default: Delete both, the rules of `.icm/_system/rules/` replace them
- answer: Delete both, the rules of `.icm/_system/rules/` replace them
### Q4. Q1 says a workflow of this repo replaces `ci.yml`. The approved spec keeps `ci.yml`. What does the new workflow run?
- type: single
- options: The same jobs as `check-client.yml`, copied into this repo | Only lint, typecheck and build | Keep `ci.yml` in this ticket and replace it in a new ticket
- default: Keep `ci.yml` in this ticket and replace it in a new ticket
- answer: Only lint, typecheck and build
