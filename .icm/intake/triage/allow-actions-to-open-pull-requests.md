# Stub: A push to main runs ci green, and release-please opens the release pull request

- lane: chore
- found-by: the intake audit · 2026-10-25
- complexity: low
- priority: P1

## Problem

`ci` fails on every push to `main` since pull request 198 (2026-10-25), last on pull request 202 (2026-10-26). The three check jobs pass. The `release` job fails at its last step with "GitHub Actions is not permitted to create or approve pull requests". The repository setting `can_approve_pull_request_reviews` is `false`. release-please writes the branch `release-please--branches--main--components--jamienisbet` and then cannot open its pull request. A red `ci` on `main` hides a real failure.

## Proposed change

Jamie turns on "Allow GitHub Actions to create and approve pull requests" in the repository: Settings, Actions, General, Workflow permissions. No code changes. If the account locks that setting, the other way is a fine-grained token passed as `token` to `release.yml` (its header names it).

## Acceptance criteria

- [ ] The setting is on, or a token is set. The pull request that retires this stub says which.
- [ ] The next push to `main` runs `ci` green, release job included.
- [ ] A release pull request is open from `release-please--branches--main--components--jamienisbet`. Jamie reads the version it proposes before any merge.
