---
description: Estate ticket hygiene — verify merged-but-open tickets into _done/, trim today dilution, surface off-ticket work
allowed-tools: Bash(_system/ticket-hygiene.sh:*), Bash(/home/jamie-nisbet/Apps/_system/ticket-hygiene.sh:*), Bash(_system/tickets-board.sh:*), Bash(/home/jamie-nisbet/Apps/_system/tickets-board.sh:*), Bash(git -C:*), Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion
---

# /groom — keep the board honest

Work from the Apps root. Sustentus-v2 is exempt. Run weekly-ish, or whenever the board
feels like it's lying. The script reports; **you verify and fix with judgment** — never
bulk-apply its findings blindly. Touch only `.icm/` files.

## 1. Report

Run `_system/ticket-hygiene.sh` and show it.

## 2. Verify possibly-done

For each open ticket whose ID appears in merged commits: check `git -C <repo> log` for
the actual work commit — **the commit that created the ticket file doesn't count**, nor
does an icm/estate-sweep commit. Where the work genuinely merged, `git mv` the ticket to
`_done/`. Where it's ambiguous, ask Jamie (batch the questions).

## 3. Trim today dilution

If more than 3 tickets are flagged `today` estate-wide, list them and ask Jamie which
(≤3) survive; the rest go back to `ready`. Stale flags from a past day default to
`ready`.

## 4. Off-ticket work

For repos with recent commits but no open tickets: distinguish real client work from
sweep/config commits (read the log). Where real work is happening off-ticket, offer to
cut backlog tickets from the recent history with Jamie — use the `ticket-scout` agent
per repo to propose candidates, batched.

## 5. Registry drift

If any repo's intake README uses a prefix missing from `_system/TICKETS-SPEC.md` /
`icm-check.sh`'s map, reconcile (spec follows reality once tickets exist; before the
first ticket, reality follows Jamie).

## 6. Hand back

Per-repo summary: what moved to `_done/`, what was reflagged, what was proposed and
declined. Leave child-repo changes **uncommitted** for review unless Jamie says push
(ticket-only commits on `main`, staged explicitly).
