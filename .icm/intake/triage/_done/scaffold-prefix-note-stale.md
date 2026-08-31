# Stub: The scaffold writes a retired ticket-prefix caveat into every new repo

- feature-slug: scaffold-prefix-note-stale
- lane: bug
- found-by: settling `scaffold-root-rails`, 2026-08-30
- priority: P2
- size: S

## What this is

`scaffoldIcmBaseline` (`websites/admin-dashboard/lib/icm-scaffold.ts`) derives a ticket
prefix from the new repo's name (`deriveTicketPrefix`) and appends `suggestedPrefixNote`
to the seeded `.icm/intake/README.md`, telling whoever opens the repo to confirm the
prefix "before cutting the first ticket (numbers are never reused)" and to register it
in `_system/contracts/TICKETS.md`.

**The estate retired ticket prefixes on 2026-08-28.** Identity is the path
(`<epic>/<slug>`) and there are no ticket numbers — the canonical
`_system/template/icm/intake/README.md` in `icm-board` says so in its own opening
paragraph, and `{{PREFIX}}` no longer appears anywhere under `_system/template/`, so the
`replaceAll("{{PREFIX}}", …)` in `render()` is a no-op. What survives is the appended
note, which now contradicts the very README it is appended to and sends a reader to
register something the contract no longer has.

So every client repo created from the dashboard since the change carries a paragraph of
wrong instructions, at the top of the one file that is supposed to teach the ticket
contract.

## The likely shape of the fix

Delete `deriveTicketPrefix`, `suggestedPrefixNote`, the `{{PREFIX}}` substitution and the
`prefix` field of `ScaffoldResult`, and let `render()` copy the template verbatim — which
is what the template README's "no substitutions" rule now asks for anyway ("a copy is
exact, which is what makes the drift report honest"). Check `deriveTicketPrefix`'s
exported callers before removing it. Verbatim copies would also let the seeded
`.icm/intake/README.md` be drift-checked against the canonical one, which it cannot be
today.

Left out of the `scaffold-root-rails` PR on purpose — a different defect in the same
file, and widening the PR to absorb it is the thing the estate's triage lane exists to
prevent.
