# JN-028 · Revoke and delete the plaintext Sanity token backup

| | |
|---|---|
| Status | ready |
| Type | security |
| Priority | P0 |
| Size | S |

## Problem

`_system/AUDIT.md` open security P0, tracked as prose since July with no ticket and no
re-check: a Sanity token sits plaintext in `~/.claude.json.bak-20260715`. Two halves,
in order:

1. **Revoke server-side** — Jamie, in Sanity's management console. The token value must
   not be read, echoed, or handled by a session.
2. **Delete the backup file** — only after revocation is confirmed.

Then move the audit line to Done with the date.

## Acceptance

- [ ] Token revoked in Sanity (Jamie confirms)
- [ ] `~/.claude.json.bak-20260715` deleted
- [ ] AUDIT.md security section updated

## Prompt

Close out the plaintext Sanity token P0 from _system/AUDIT.md. Read
.icm/intake/JN-028-revoke-sanity-token-backup.md for full context. Walk Jamie through
revoking the token in Sanity's console first — never read or display the token value —
and only after he confirms revocation, delete ~/.claude.json.bak-20260715 and update the
audit's security section. The audit edit is a doc-only commit straight to main.
