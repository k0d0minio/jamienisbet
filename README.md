# jamienisbet — the web estate

The personal web estate of **Jamie Nisbet**, a software engineer / AI consultant based in
Mafra, Portugal. Deliberately small: one Next.js app and the shared packages beneath
it, deployed as one Vercel project off a pnpm monorepo.

## The map

```text
jamienisbet/
├── AGENTS.md            agent identity & routing (read first; CLAUDE.md imports it)
├── README.md            you are here
│
├── websites/
│   └── portfolio/       the public portfolio — i18n (en/fr/pt), markdown case studies,
│                        contact form → the desk's pool + Resend notification
│
├── packages/            shared code
│   ├── ui/              @jamie-nisbet/ui — the design system; THE brand source of truth
│   │                    (tokens, components, assets, BRAND.md)
│   └── app-shell/       @jamie-nisbet/app-shell — marketing-site chrome + i18n plumbing
│
└── .icm/
    ├── intake/          this repo's work backlog — epics + triage stubs, identity is
    │                    the path (estate-wide standard; see intake/README.md)
    └── docs/            preserved history: founder-brief.md, decisions.md
```

## How it runs

- **Business state lives in the desk** (`legible-consulting/house`), not here. The contact
  form posts each lead to the desk's pool API.
- **Tickets** for this repo are markdown stubs in [`.icm/intake/`](.icm/intake/README.md).
- **CI** (`.github/workflows/`) typechecks and lints the workspace. CI is the source of
  truth — don't run checks locally.

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
