# jamienisbet — the web estate

The personal web estate of **Jamie Nisbet**, a software engineer / AI consultant based in
Mafra, Portugal. Deliberately small: one Next.js app at the repo root — the public portfolio
at `jamienisbet.com` — deployed as one Vercel project.

## The map

```text
jamienisbet/
├── AGENTS.md            agent identity & routing (read first; CLAUDE.md imports it)
├── README.md            you are here
├── BRAND.md             the brand guide — voice, visual foundations, iconography
│
├── app/                 Next.js App Router — home, /work, /work/[slug], /tech, the contact action
├── components/          the site's sections, plus the design system:
│                        ui/ (shadcn primitives) · brand/ (logo, eyebrow) · motion/ · shell/ (chrome)
├── content/work/        case studies as markdown + YAML front-matter
├── i18n/ · messages/    next-intl routing (en/fr/pt) and the message catalogs
├── lib/                 site config, the content loader, the contact schema, cn()
├── emails/              the Resend template behind the contact form notification
│
├── tokens/              the brand tokens, one CSS file per concern — THE brand source of truth
├── styles.css           Tailwind v4 + shadcn theme entry (app/globals.css imports it once)
├── tokens.css           the variables-only layer for static HTML and email
├── assets/              logo artwork (logo/), the social card and email signature (brand/)
│
└── .icm/
    ├── intake/          this repo's work backlog — epics + triage stubs, identity is
    │                    the path (estate-wide standard; see intake/README.md)
    └── docs/            preserved history: founder-brief.md, decisions.md
```

## How it runs

- **Run it:** `pnpm install`, then `pnpm dev` (http://localhost:3000).
- **Business state lives in the desk** (`legible-consulting/house`), not here. The contact
  form posts each lead to the desk's pool API and mails Jamie through Resend. The variables
  it needs are in [`.env.example`](.env.example).
- **Tickets** for this repo are markdown stubs in [`.icm/intake/`](.icm/intake/README.md).
- **CI** (`.github/workflows/ci.yml`) runs the shared client checks. CI is the source of
  truth — don't run checks locally.

## Deployment

One Vercel project, `portfolio`, on the **kodominio** team, builds this repo. Its Root
Directory is the repo root, and its production domain is `jamienisbet.com`. `vercel.json`
sets the framework. Env vars live in the Vercel project, never in git.

Every push deploys: `main` to production, every other branch to a preview. There is no
`ignoreCommand` on purpose. Per Vercel's docs, a cancelled deployment still counts towards
the **100 deployments per day** cap.

### Turning previews off

Previews are the bulk of the spend. The portfolio keeps them today: its UI is worth looking
at before merge. If the daily cap starts biting, opt out of everything except `main` in
`vercel.json`:

```json
{ "git": { "deploymentEnabled": { "*": false, "**": false, "main": true } } }
```

Branch keys are [minimatch](https://github.com/isaacs/minimatch) patterns and **unspecified
branches default to `true`**, so the denial has to be explicit — `{ "main": true }` alone is
a no-op. `*` covers flat names like `chore-x`, `**` covers slashed ones like `claude/x`, and
`main` wins over both because a branch matching several rules deploys if *any* of them is
`true`.

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
