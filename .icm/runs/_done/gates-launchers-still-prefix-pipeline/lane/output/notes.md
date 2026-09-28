# Chore: gates-launchers-still-prefix-pipeline

- invariant: behaviour unchanged; the two launch strings `gates.ts` builds send a bare
  verb + slug instead of naming the router with a `/pipeline ` prefix.
- change: `websites/admin-dashboard/lib/gates.ts`: dropped `/pipeline ` from the red-PR
  build/release launch prompt and the scope-batch `new` launch prompt, matching
  `tickets.ts`'s `pickupOnly` — every repo's own router already reads the bare verb whole.
- rollback: revert the two string edits in `gates.ts` (no data, no migration).
- learned: none
