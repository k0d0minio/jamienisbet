# jamienisbet — the estate control layer + the web estate

The estate of **Jamie Nisbet**, a software engineer / AI consultant based in Mafra,
Portugal. The repo root is the ICM control layer — contracts, estate scripts, tickets,
agent routing. Everything with code in it lives one level down in `projects/`, including
the house web estate: four Next.js apps and the shared packages beneath them, deployed as
separate Vercel projects off one pnpm monorepo.

## The map

```text
Apps/                          the repo root — ICM control layer, no application code
├── CLAUDE.md                  agent identity & routing (read first)
├── README.md                  you are here
│
├── _system/                   estate doctrine: contracts, scripts, template, audit
├── .claude/                   three commands (/project /day /icm-check), two agents, hook
├── .icm/
│   ├── intake/                the JN-NNN-slug.md ticket backlog (estate-wide standard)
│   ├── onboarding/            house questionnaires the dashboard's Forms card sends
│   └── docs/                  preserved history: founder-brief.md, decisions.md
├── .github/workflows/         CI + DB migrations (GitHub only reads these at the root)
│
└── projects/                  one folder per repo — gitignored, except the one below
    ├── <client>/              client delivery repos: separate git repos, never tracked here
    └── jamienisbet/           THE HOUSE WEB ESTATE — tracked here; pnpm workspace root
        ├── websites/
        │   ├── portfolio/       the public portfolio — i18n (en/fr/pt), markdown case
        │   │                    studies, contact form → Neon biz.clients + Resend
        │   ├── admin-dashboard/ the cockpit — owner-only PWA, four screens:
        │   │                    Leads · a lead's profile · Tickets · Money (Stripe)
        │   ├── payment-gateway/ the client-facing pay page — /pay/[invoice], Stripe
        │   │                    Embedded Checkout + signature-verified webhook
        │   └── sellers-site/    the affiliate front door — referral intake → Neon + Resend
        └── packages/            shared code
            ├── ui/              @jamie-nisbet/ui — the design system; THE brand source of
            │                    truth (tokens, components, assets, BRAND.md)
            ├── app-shell/       @jamie-nisbet/app-shell — marketing chrome + i18n plumbing
            └── services/        @jamie-nisbet/services — Neon biz.* schema (Drizzle)
```

## How it runs

- **Business state lives in one store** — the Neon `biz.*` schema (leads, todos, compliance
  dates), operated through the admin dashboard. Nothing is mirrored back into git; money
  itself lives in Stripe (the payment gateway is its client-facing checkout surface).
- **The Tickets screen** reads every active repo's `.icm/intake/` markdown backlog live from
  GitHub (read-only; the repos own their tickets). Estate spec:
  [`_system/contracts/TICKETS.md`](_system/contracts/TICKETS.md).
- **The pnpm workspace root is `projects/jamienisbet/`**, not the repo root. Run `pnpm`
  from there; the four Vercel projects set their Root Directory to
  `projects/jamienisbet/websites/<app>`.
- **CI** (`.github/workflows/`) typechecks, lints and builds all four apps and guards DB
  migrations. Workflows must sit at the repo root, so every step names its working
  directory explicitly. CI is the source of truth — don't run checks locally.

## History

Until 2026-08 this repo was "the operating system for one business": a full ICM markdown
factory (`_config/`, `shared/`, `workspaces/`) alongside the websites. The factory was
retired in favour of exactly what's above — the story is preserved in
[`.icm/docs/decisions.md`](.icm/docs/decisions.md) and the original intent in
[`.icm/docs/founder-brief.md`](.icm/docs/founder-brief.md).

— Start at [`CLAUDE.md`](CLAUDE.md)
