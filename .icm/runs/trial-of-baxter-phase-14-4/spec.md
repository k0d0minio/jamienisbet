# Spec: trial of BAXTER phase 14-4

- ticket: triage/trial-of-baxter-phase-14-4
- touches: README.md
- complexity: trivial

## Problem

This ticket is a trial of BAXTER phase 14-4. It is not real work. The trial examines that a
session that BAXTER started stops at the gate Spec approved, with a draft pull request.
`README.md` does not have the trial sentence today.

## Proposed change

`README.md` gets one sentence at its end: "This line is a trial of BAXTER phase 14-4."
The sentence is a paragraph of its own, after one empty line. It is the last line of the
file. No other line of the file changes.

## Acceptance criteria

- [ ] The last line of `README.md` is the sentence "This line is a trial of BAXTER phase 14-4." (verify: agent)
- [ ] The diff of `README.md` adds one empty line and that one sentence, and it changes no other line. (verify: agent)
- [ ] The `ci` run of the pull request is green. (verify: CI)

## Out of scope

- A change to a file of the product other than `README.md`.
- A change to the pages, the copy or the translations of the site.
- The merge and the Release stage. The ticket says that nothing is built and nothing is merged.
- The close of the pull request and the removal of the branch after the trial. A later session does them.

## Open questions

- none
