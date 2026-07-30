---
slug: agorasim
title: "Built to be found by AI, not just Google"
summary: "A classic-car tour business in the Saloia countryside needed more than a brochure site. I built a bilingual site engineered for AI search, plus the back office and content pipeline behind it."
client: "Agorasim"
year: 2026
services:
  - GEO optimisation
  - AI business infrastructure
  - Software engineering
stack:
  - Next.js
  - TypeScript
  - Neon Postgres
  - Drizzle ORM
  - Tailwind CSS
  - Vercel
outcome: "A bilingual site AI search can read, with a back office and content pipeline behind it"
featured: true
order: 2
# CONFIRM before publishing — is the rebuild live, and has it replaced agorasim.pt?
# url: https://
---

## The problem

Agorasim runs guided classic-car tours through the Saloia countryside — Sintra,
Mafra, Ericeira. It's a genuinely good product with a discovery problem.

More and more, the question "what's a unique day trip from Lisbon?" gets asked to
ChatGPT or Perplexity rather than typed into Google. Those systems don't rank pages
the way search engines do; they read structured, answer-first content and cite what
they can parse. Almost no local tour operator is set up for that yet, which makes it
a cheap advantage while it lasts.

The second problem is quieter: a tour business is two people driving cars. Nobody
has an afternoon to write blog posts.

## What I built

**A bilingual site engineered for AI search.** Portuguese and English, kept in sync
by design — content is modelled as localised objects, so a missing translation is a
type error rather than a page that silently falls back to the wrong language. Every
page ships JSON-LD structured data, canonical and hreflang tags, and answer-first
copy. The sitemap and robots rules explicitly welcome AI crawlers, and there's an
`llms.txt` describing the business in the format the assistants read.

**The pages that make the funnel**: home, the experiences (the signature Rural
Saloia tour and its add-ons, each with its own page), events, weddings, a blog, a
referral page, an onboarding form, and contact.

**A back office on Postgres.** Inbound tour requests land in a database rather than
an inbox. Alongside them sits a draft table per content pipeline — GEO content, blog
posts, social posts, email campaigns — feeding an admin area covering bookings, CRM,
blog, social, email, referrals, notifications and submissions.

**A content factory, not just content.** The marketing pipelines are structured as
plain markdown workspaces: the brand voice, the facts and the style live in
configuration once, and each run produces a new draft from that configuration. The
practical upshot is that improving the *rules* improves every future post, and
nothing publishes until a human has approved it in the dashboard.

## Decisions worth explaining

**The site is fully static.** For a business whose visitors mostly arrive from a
phone on patchy rural signal, fast beats clever. Static also means AI crawlers get
the full content without executing anything.

**Booking still goes through FareHarbor.** They already had it and it already works,
so I wired the existing booking lightbox in rather than replacing a working system on
day one. Until the account is configured, the "Reservas" buttons fall back to the
contact page — the site never shows a dead button.

**Generated content is reviewed, never auto-published.** Drafts land in the
dashboard and wait. AI is good at the first 80% of a blog post about the Saloia
countryside and bad at knowing which winery closed last month.

## The result

Agorasim has a site that reads well to people and parses cleanly for the AI
assistants their customers are increasingly asking, and the infrastructure — lead
database, admin, draft pipelines — is in place for the marketing to run without
eating their week.
