# Jamie Nisbet — app

Jamie Nisbet's portfolio, the public site at `jamienisbet.com`, rendered from
`legible-consulting/blueprint`. One Next.js app at the repo root, deployed as the
Vercel project `portfolio`. This file is identity and routing only. Copier writes it once:
`copier update` never overwrites it, so the app's own routing rows go below.

## Routing

| You are asked to | Go to |
|---|---|
| build the next ticket, or any ticket | `.icm/intake/CONTEXT.md` (the loop), then the stub |
| fix a bug, make a tweak or do a chore, with or without a stub | `.icm/lanes/<lane>/CONTEXT.md`: `bug`, `tweak` or `chore` |
| fix a fault that production shows now | `.icm/lanes/hotfix/CONTEXT.md` |
| do work that has no ticket | `.icm/intake/CONTEXT.md` § A request with no stub |
| answer a question about the build, or review | read and answer. No stub, no branch, no pull request |
| open, fill or finish a pull request | `.github/pull_request_template.md`. The gates sit at its top |
| merge after the tick | `.icm/intake/CONTEXT.md` § The loop, step 7 |
| plan new work | `.icm/intake/CONTEXT.md` (an epic with a breakdown), never a loose list |
| understand the app, its stack and its data | `README.md` |
| change what CI checks | `legible-consulting/.github` (`check-client.yml`). `ci.yml` here only calls it |
| change a file the blueprint renders | the blueprint, then `copier update` here |
| add or edit a case study | `content/work/` (markdown with YAML front-matter, read by `lib/work.ts`) |
| change the site's pages, sections or the contact form | `app/`, `components/`, `lib/` |
| change copy or a translation (en, fr, pt) | `messages/`, routing in `i18n/` |
| change a colour, a type step or any brand value | `tokens/`, then `styles.css`. The rules are in `BRAND.md` |
| design or review anything a user sees | `BRAND.md` (voice, visual foundations, iconography) and `components/{ui,brand,motion,shell}/` |
| change the contact notification email | `emails/` |

## Rules

- Client-facing text in `en`, with `fr` and `pt` kept in step. Code, commits and notes in
  English.
- Technical text (stubs, pull request bodies, commits, questions) in Simplified Technical
  English: short active sentences, one instruction each, no semicolons. A question for Jamie
  is numbered and carries a default answer.
- CI is truth: never run build, lint, typecheck, test, format or dev locally. Push, then read
  the `ci` run and the preview.
- Secrets never in git: names only, values in GitHub or Vercel settings. Flag any plaintext
  credential found.
- One ticket is one branch and one pull request. The pull request moves the stub to `_done/`.
- `main` changes by pull request. Gates are human checkboxes: read them, never tick them.
  Jamie ticks Ready to merge, and the session merges with `.icm/scripts/merge.sh`.
  Production follows `main`: the merge is the release.
- The brand has one source of truth: `tokens/` and `styles.css`. Components read the tokens.
  Never inline a token value.
- No outbound action without review. A human composes and sends any outreach email.
