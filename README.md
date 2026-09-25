# jamienisbet — the web estate

The personal web estate of **Jamie Nisbet**, a software engineer / AI consultant based in
Mafra, Portugal. Deliberately small: three Next.js apps and the shared packages beneath
them, deployed as separate Vercel projects off one pnpm monorepo.

## The map

```text
jamienisbet/
├── AGENTS.md            agent identity & routing (read first; CLAUDE.md imports it)
├── README.md            you are here
│
├── websites/
│   ├── portfolio/       the public portfolio — i18n (en/fr/pt), markdown case studies,
│   │                    contact form → Neon biz.clients + Resend notification
│   ├── admin-dashboard/ the cockpit — owner-only PWA, four screens:
│   │                    Leads · a lead's profile · Tickets · Money (Stripe)
│   └── sellers-site/    the affiliate program's front door — referral intake → Neon + Resend
│
├── packages/            shared code
│   ├── ui/              @jamie-nisbet/ui — the design system; THE brand source of truth
│   │                    (tokens, components, assets, BRAND.md)
│   ├── app-shell/       @jamie-nisbet/app-shell — marketing-site chrome + i18n plumbing
│   └── services/        @jamie-nisbet/services — Neon biz.* schema (Drizzle) + queries
│
└── .icm/
    ├── intake/          this repo's work backlog — epics + triage stubs, identity is
    │                    the path (estate-wide standard; see intake/README.md)
    └── docs/            preserved history: founder-brief.md, decisions.md
```

## How it runs

- **Business state lives in one store** — the Neon `biz.*` schema (leads, touches, opt-outs,
  questionnaires), operated through the admin dashboard. Nothing is mirrored back into git; money
  itself lives in Stripe.
- **The Tickets screen** reads every active repo's `.icm/intake/` markdown backlog live from
  GitHub (read-only; the repos own their tickets) — the client repos plus the two house
  repos, this one and `icm-board`. Canonical ticket spec: `_system/contracts/TICKETS.md`
  in `icm-board`; the copy that matters here is [`.icm/intake/README.md`](.icm/intake/README.md).
- **CI** (`.github/workflows/`) typechecks, lints and builds all three apps and guards DB
  migrations. CI is the source of truth — don't run checks locally.

## History

Until 2026-08 this repo was "the operating system for one business": a full ICM markdown
factory (`_config/`, `shared/`, `workspaces/`) alongside the websites. The factory was
retired in favour of exactly what's above. On 2026-08-26 the remaining estate control
layer (`_system/`, the three commands, the two agents) left for its own repo,
`k0d0minio/icm-board`, so that ticketing and CI would sit next to the code whose logic
they describe. This repo kept the remote, the history and everything under it — the story
is preserved in
[`.icm/docs/decisions.md`](.icm/docs/decisions.md) and the original intent in
[`.icm/docs/founder-brief.md`](.icm/docs/founder-brief.md).

— Start at [`AGENTS.md`](AGENTS.md)
