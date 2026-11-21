# Jamie Nisbet — app

Jamie Nisbet's portfolio, the public site at `jamienisbet.com`. One Next.js app at the
repo root, deployed as the Vercel project `portfolio`. This file is identity and routing
only. The BAXTER blueprint writes it one time: an update of the blueprint never overwrites
it, so the app's own routing rows go below.

## Pipeline

@.icm/_system/ROUTER.md

The pipeline is `.icm/_system/` (BAXTER blueprint). The router above is the one route for
pipeline work: a ticket, a bug, a tweak, a chore, a build, a release and a pull request.

## Routing

| You are asked to | Go to |
|---|---|
| any pipeline work: a ticket, a lane, a pull request, a merge, a plan | `.icm/_system/ROUTER.md` |
| answer a question about the build, or review | read and answer. No stub, no branch, no pull request |
| understand the app, its stack and its data | `README.md` |
| change what CI checks | the scripts `lint`, `typecheck` and `test` of `package.json`. `.github/workflows/ci.yml` and `.icm/_system/ci/code.sh` belong to the blueprint |
| change a file the blueprint renders | tell Jamie: the correction is made in the BAXTER blueprint and comes with its next update |
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
  Jamie ticks Ready to merge. The merge follows the Release stage of `.icm/_system/`.
  Production follows `main`: the merge is the release.
- The brand has one source of truth: `tokens/` and `styles.css`. Components read the tokens.
  Never inline a token value.
- No outbound action without review. A human composes and sends any outreach email.
