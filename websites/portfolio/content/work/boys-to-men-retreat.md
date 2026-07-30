---
slug: boys-to-men-retreat
title: "A retreat website that speaks five languages"
summary: "A four-day retreat in Ericeira draws families from across Europe. I rebuilt the site mobile-first in five languages, with an application form that lands straight in the team's inbox."
client: "Boys To Men Retreat"
year: 2026
services:
  - Landing pages, fully serviced
  - Software engineering
stack:
  - Next.js
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Resend
outcome: "Five languages, one source of copy, and applications arriving as structured email"
featured: true
order: 4
# CONFIRM before publishing — is the redesign live, and at boystomenretreat.com?
# url: https://www.boystomenretreat.com
---

## The problem

Boys To Men Retreat runs a four-day, four-night retreat in Ericeira for boys aged
9 to 16 — challenge, adventure and self-discovery, in a place that lends itself to
all three. The audience is parents, they're mostly on a phone, and they're spread
across Europe: Dutch, Portuguese, French and Spanish speakers alongside English.

The existing site had the substance. It read like a site built before phones were
how people browsed, and it only spoke English.

## What I built

**A mobile-first rebuild that keeps every word.** This was a first-pass redesign by
agreement: preserve all the existing copy and information, apply current design
practice, and leave brand identity for a later round. Deciding what the retreat
*sounds* like is a separate conversation from making it readable on a phone, and
mixing the two makes both slower.

**Five languages, one canonical source.** English, Dutch, Portuguese, French and
Spanish. URLs are locale-prefixed, and a visitor landing on the root is redirected to
their browser's language. The English copy file is the canonical shape and every
other locale is typed against it — so if a translation goes missing, the build fails
rather than the page quietly showing English to a Dutch parent.

**An application flow that actually completes.** A multi-step form rather than one
intimidating wall of fields, validated on the server as well as the client, arriving
in the team's inbox as a formatted email through Resend.

## Decisions worth explaining

**The translations are machine-assisted, and flagged as such.** They're good enough
to read and not good enough to be the last word — particularly on the application
form's legal screens and the privacy policy, which want a native speaker and probably
a lawyer. That's written into the handover notes rather than left as a pleasant
surprise for later.

**The gallery ships as styled placeholders.** Real retreat photography wasn't ready,
and placeholder tiles that look deliberate beat stock images of somebody else's
children. Dropping the real photos in is a file swap, not a rebuild.

**The palette is a placeholder too.** Ocean and sand, set as CSS variables in one
place, so the brand round changes a handful of values rather than hunting through
components.

## The result

The retreat now has a site that works on the device parents actually use, in the
language they actually read, with a clear path from "this looks interesting" to a
completed application — and a documented, honest list of what the next pass should
pick up.
