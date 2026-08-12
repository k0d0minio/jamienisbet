# JN-008 · Write completed questionnaire answers back into the client repo

| | |
|---|---|
| Status | ready |
| Type | feature |
| Priority | P1 |
| Size | M |

## Problem

The onboarding-form loop is open: forms are sent from the lead profile, answers land in
Neon `biz.form_links.answers` (jsonb) — and nothing consumes them. Claude sessions
working in the client repo can't see what the client answered, so tickets get written
from memory instead of from the client's own words. Casey answered her questionnaire;
her tickets were hand-written before it.

The estate convention is that provenance lives as files in the client repo
(`.icm/docs/`, collabimmo pattern). The dashboard already writes to GitHub
(`lib/github.ts` has a token and `createRepo`), so it can close the loop.

## Acceptance

- [ ] When a form is completed (or via a button on the Forms card), the answers are
      rendered as readable markdown (question → answer, form slug + dates in front
      matter or a header) and committed to the client's repo as
      `.icm/docs/form-<slug>-<YYYY-MM-DD>.md`
- [ ] Works only when the client row has `github_repo`; graceful no-op otherwise
- [ ] Re-completion/re-send never overwrites an existing file (new dated file)
- [ ] One store rule respected: Neon stays the record; the repo file is a rendered copy
- [ ] CI green

## Prompt

Close the questionnaire loop in the admin dashboard: render a completed
`biz.form_links` row (form_snapshot + answers) to markdown and commit it to the
connected client repo as `.icm/docs/form-<slug>-<date>.md` via the existing GitHub
client in websites/admin-dashboard/lib/github.ts. Trigger: on form completion if
straightforward, else a "Write to repo" action on the Forms card
(components/form-links.tsx). Read
.icm/intake/JN-008-write-form-answers-to-client-repo.md for full context. Open a PR on
a claude/ branch; do not run local checks — CI is the source of truth.
