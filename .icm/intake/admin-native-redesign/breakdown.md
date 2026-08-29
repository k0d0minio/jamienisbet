# Admin native redesign — breakdown

- epic: admin-native-redesign
- cut: 2026-08-29, design-rethink session (interrogation of Jamie, three rounds)
- scope: `websites/admin-dashboard` + a new sanctioned app tier in `packages/ui`

## What was understood

The admin works — data, gestures, and mobile responsivity are all in good shape — but the
*space* is lacking on every axis asked about: visual personality (reads as default shadcn
with a coat of paint), glanceability (you read the screen instead of scanning it),
depth and polish (one flat elevation, hairline boxes, little motion), and structure
(where things live could be rethought, not just restyled).

The chosen destination is a **full native feel**: the installed PWA should stop looking
like a website and feel like an iOS-class app — depth, materials, physical motion — taking
Apple's current design language as the reference: the classic HIG pillars (clarity,
deference, depth; large titles; grouped inset lists; progressive disclosure) plus the
iOS 26 *Liquid Glass* layer (floating translucent chrome, hierarchy through depth,
content always leading).

## Decisions (all Jamie's, 2026-08-29)

1. **Apple dose** — full native feel. Translucent materials, floating chrome, depth and
   vibrancy. The Swiss-flat rule bends *for this app*.
2. **Where the DNA lives** — a sanctioned **app tier inside `packages/ui`**. No fork:
   the package grows app-surface tokens and operator components that only app-like
   surfaces use. Marketing sites are untouched and keep the flat brand.
3. **Information architecture** — the **needs-you inbox** map. Home becomes a triaged
   attention feed (stale leads, overdue todos, compliance dates, unpaid invoices,
   today's tickets) where each row acts in place or deep-links. Tabs become
   **Needs you · Leads · Tickets · Money**. The working-list strip on Leads dies; its
   content joins the feed.
4. **Proving ground** — the **lead profile**, rebuilt in the iOS Contacts idiom:
   collapsing identity header, prominent action row, grouped inset sections.
5. **Colour** — slate stays the only tint, iOS-style: one brand tint for interactive,
   muted semantics only for state (overdue red, paid green). No per-domain accents.
6. **Motion** — **full physicality**: spring-based motion (subtle, critically damped —
   no cartoon overshoot), scroll-linked large titles, sheet detents, haptics on state
   changes. The brand's "no spring" rule is amended for app surfaces only.
7. **Typography** — **system font stack** for UI chrome and text (SF on Apple devices);
   **IBM Plex Mono stays for figures** — it is the brand's signature. Type scale goes
   native: large-title class (~34px), 17px body, subhead/footnote/caption tiers,
   heavier weight contrast. Hanken Grotesk stays the marketing face; it leaves the admin.
8. **Desktop** — **iPad-style scale-up**: one design that grows — sidebar instead of tab
   bar, same grouped lists and cards, popovers instead of sheets. The desktop tables are
   retired; one codepath, one feel.
9. **Appearance** — **follow the system**, like every native app. No in-app toggle. Both
   modes get full design attention; materials and vibrancy differ per mode.

## Brand-rule amendments (scoped to the app tier)

Recorded here so no later session treats them as drift. On app surfaces only:

- Translucent materials and backdrop blur are structural, not reserved for the header.
- Springs are sanctioned where iOS muscle memory expects them; still no bounce for
  decoration, and everything respects `prefers-reduced-motion`.
- UI text sets in the system font stack; mono figures remain non-negotiable.
- Elevation exists: floating chrome and sheets sit visibly above content.

Unchanged everywhere: slate is the only tint, sentence case, no emoji, quiet specific
copy, semantic tokens only (the app tier ships its *own* tokens — raw values stay banned
at call sites), 44px touch floor, four designed states per view.

Stub 1 writes these amendments into `packages/ui/BRAND.md` and the `design-dna` skill so
every future session inherits them; until it lands, this file is the authority.

## Build order

1. `app-tier-foundations` — the app tier in `packages/ui`: material/elevation/spring/type
   tokens, grouped-list and large-title primitives, docs + rule amendments.
2. `app-shell-chrome` — floating tab bar, collapsing large-title header, desktop sidebar,
   system-appearance wiring.
3. `lead-profile-contacts-card` — the proving ground: Contacts-style profile.
4. `leads-list-native` — the list screen in the new idiom; desktop table retired.
5. `needs-you-inbox` — the new home feed and the fourth tab; working-list strip retired.
6. `money-native` — Money in the new idiom; desktop tables retired.
7. `tickets-board-native` — the batch board in the new idiom.
8. `native-polish-sweep` — haptics/motion audit, states, login, PWA shell, accessibility.

Sequenced so the visual language is proven on the densest screen (3) immediately after
the foundations exist, the most-seen screen follows (4), and the riskiest IA change (5)
lands only once the component vocabulary is settled. 6–8 are P2: the app is coherent
after 5, and the tail converts the remaining screens and polishes the whole.

## Sources

- Apple Human Interface Guidelines — https://developer.apple.com/design/human-interface-guidelines
- Meet Liquid Glass (WWDC25) — https://developer.apple.com/videos/play/wwdc2025/219/
- Liquid Glass principles commentary — https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/
- iOS 26 design patterns, illustrated — https://www.learnui.design/blog/ios-design-guidelines-templates.html
