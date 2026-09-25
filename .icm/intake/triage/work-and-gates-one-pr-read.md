# Stub: Work and the Inbox read pull requests twice

- lane: chore
- found-by: build work-reader · 2026-09-25
- complexity: medium

## Problem

Two reads of the same open pull requests now exist. Work's running detection
(`fetchOpenPulls` in `websites/admin-dashboard/lib/tickets.ts`, spec work-reader §3) makes one
REST `pulls?state=open` call per repo on the position clock, plus a `pulls/{n}/files` call per
open lane PR. The Inbox's gates (`lib/gates.ts`, gates-read) read the same PRs through one
GraphQL query per ten repos. Each has its own slug parser for the PR body (`prSlug` in
`tickets.ts`, `runSlugOf` in `gates.ts`). The request budgets add up, and the two parsers can
drift.

## Proposed change

Investigate one PR read that both screens share: for example, the gates GraphQL query extended
with what Work needs (body, labels, head ref, and for lane PRs the file list), cached once and
read by both. Or keep two reads but share one slug parser and one lane-label set. Keep Work's
board from waiting on the Inbox's 10-second bound.
