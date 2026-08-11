# jamienisbet — the web estate

The personal web estate of **Jamie Nisbet**, a software engineer / AI consultant based in
Mafra, Portugal. Deliberately small: four Next.js apps and the shared packages beneath
them, deployed as separate Vercel projects off one pnpm monorepo.

## The map

```text
jamienisbet/
├── CLAUDE.md            agent identity & routing (read first)
├── README.md            you are here
│
├── websites/
│   ├── portfolio/       the public portfolio — i18n (en/fr/pt), markdown case studies,
│   │                    contact form → Neon biz.clients + Resend notification
│   ├── admin-dashboard/ the cockpit — owner-only PWA, four screens:
│   │                    Leads · a lead's profile · Tickets · Money (Stripe)
│   ├── payment-gateway/ the client-facing pay page — /pay/[invoice], Stripe Embedded
│   │                    Checkout + signature-verified webhook
│   └── sellers-site/    the affiliate program's front door — referral intake → Neon + Resend
│
├── packages/            shared code
│   ├── ui/              @jamie-nisbet/ui — the design system; THE brand source of truth
│   │                    (tokens, components, assets, BRAND.md)
│   ├── app-shell/       @jamie-nisbet/app-shell — marketing-site chrome + i18n plumbing
│   └── services/        @jamie-nisbet/services — Neon biz.* schema (Drizzle) + queries
│
└── .icm/
    ├── intake/          this repo's ticket backlog (JN-NNN-slug.md, estate-wide standard)
    └── docs/            preserved history: founder-brief.md, decisions.md
```

## How it runs

- **Business state lives in one store** — the Neon `biz.*` schema (leads, todos, compliance
  dates), operated through the admin dashboard. Nothing is mirrored back into git; money
  itself lives in Stripe (the payment gateway is its client-facing checkout surface).
- **The Tickets screen** reads every active repo's `.icm/intake/` markdown backlog live from
  GitHub (read-only; the repos own their tickets). Estate spec: `_system/TICKETS-SPEC.md`.
- **CI** (`.github/workflows/`) typechecks, lints and builds all four apps and guards DB
  migrations. CI is the source of truth — don't run checks locally.

## History

Until 2026-08 this repo was "the operating system for one business": a full ICM markdown
factory (`_config/`, `shared/`, `workspaces/`) alongside the websites. The factory was
retired in favour of exactly what's above — the story is preserved in
[`.icm/docs/decisions.md`](.icm/docs/decisions.md) and the original intent in
[`.icm/docs/founder-brief.md`](.icm/docs/founder-brief.md).

— Start at [`CLAUDE.md`](CLAUDE.md)
