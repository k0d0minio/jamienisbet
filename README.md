# jamienisbet — the portfolio

Jamie Nisbet's public site at `jamienisbet.com`. Jamie is a software engineer and AI
consultant based in Mafra, Portugal. The site presents his work, his services and a contact
form. It is one Next.js app (App Router) at the repo root, in English, French and Portuguese,
deployed as one Vercel project.

## The map

```text
jamienisbet/
├── CLAUDE.md            identity and routing for an agent session
├── README.md            you are here
├── BRAND.md             the brand guide: voice, visual foundations, iconography
│
├── app/                 Next.js App Router: home, /work, /work/[slug], /tech, the contact action
├── components/          the site's sections, plus the design system:
│                        ui/ (shadcn primitives) · brand/ (logo, eyebrow) · motion/ · shell/ (chrome)
├── content/work/        case studies as markdown + YAML front-matter
├── i18n/ · messages/    next-intl routing (en/fr/pt) and the message catalogs
├── lib/                 site config, the content loader, the contact schema, cn()
├── emails/              the Resend template behind the contact form notification
│
├── tokens/              the brand tokens, one CSS file per concern: the brand source of truth
├── styles.css           Tailwind v4 + shadcn theme entry (app/globals.css imports it once)
├── tokens.css           the variables-only layer for static HTML and email
├── assets/              logo artwork (logo/), the social card and email signature (brand/)
│
└── .icm/
    ├── intake/          the tickets: epics and triage stubs. The contract is intake/CONTEXT.md
    └── scripts/         new-run.sh starts a ticket, close-out.sh retires a finished epic
```

## How it runs

- **Run it:** `pnpm install`, then `pnpm dev` (http://localhost:3000).
- **The contact form** (`app/actions/contact.ts`) validates each enquiry with
  `lib/contact-schema.ts`. It posts the lead to the desk's pool API and mails Jamie through
  Resend. The desk (`legible-consulting/house`) holds the business state. This repo holds
  none. The variables the form needs are in [`.env.example`](.env.example).
- **Tickets** for this repo are markdown stubs in [`.icm/intake/`](.icm/intake/README.md).
- **CI** (`.github/workflows/ci.yml`) calls the shared client checks and the release
  workflow in `legible-consulting/.github`. CI is the source of truth. Do not run checks
  locally.

## The content

Each case study is one markdown file in `content/work/`. Its YAML front-matter carries the
slug, the title, the summary, the client, the year, the services and the stack. `lib/work.ts`
reads the folder, so a new file is a new page at `/work/<slug>`. The rest of the site copy is
in `messages/{en,fr,pt}.json`. Keep the three catalogs in step.

## The brand

The brand is "Jamie Nisbet.": paper and ink, monochrome, quiet. [`BRAND.md`](BRAND.md) is
the guide. [`tokens/`](tokens/) holds the values, and [`styles.css`](styles.css) maps them
onto Tailwind and shadcn. Components read the tokens and never inline a value. The desk in
`legible-consulting/house` also reads `tokens/`, including `tokens/desk.css`, which nothing
in this repo links.

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
