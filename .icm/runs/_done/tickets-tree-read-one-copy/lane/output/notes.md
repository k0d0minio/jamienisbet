# Chore: tickets-tree-read-one-copy

- invariant: behaviour unchanged; `fetchRepoTickets` and `readRepoTree` return the same shapes
  as before for every status GitHub can send — only the 404 explanation text is now shared
  instead of duplicated (the tickets board's own 404 message replaces the gates screen's bare
  "GitHub returned HTTP 404").
- change: `websites/admin-dashboard/lib/tickets.ts`: `readRepoTree` now special-cases 404 with
  the token-visibility explanation (moved from `fetchRepoTickets`); `fetchRepoTickets` calls
  `readRepoTree` instead of repeating the tree fetch, and wraps its `error` string into the
  `TicketFetchError` shape it already returned.
- rollback: revert the commit — no data or schema touched.
- learned: none
