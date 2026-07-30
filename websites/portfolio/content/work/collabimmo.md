---
slug: collabimmo
title: "One page, one job: turn visitors into enquiries"
summary: "A Belgian commercial property agency wanted a site that collects information, not one that lists property. I built the page, hardened the form, and prototyped where AI could take work off their desk next."
client: "Collabimmo"
year: 2026
services:
  - Landing pages, fully serviced
  - Software engineering
  - AI consultancy
stack:
  - Next.js
  - TypeScript
  - Tailwind CSS
  - Resend
  - Cloudflare Turnstile
  - Claude API
outcome: "A single-purpose lead-capture page, with the spam and abuse handling done properly"
featured: true
order: 3
# CONFIRM before publishing — is the site live at www.collabimmo.be?
# url: https://www.collabimmo.be
---

## The problem

Collabimmo is a Belgian agency handling commercial property transactions. Their
brief was refreshingly clear, and worth quoting the shape of it: this is *not* a
site with property listings like every other agency. It's a single page whose job is
to get the visitor to fill in the contact form and tell them as much as possible.
Sober, in the colours of their logo, with the call to action as the focus.

When a client is that specific about scope, the useful thing I can do is not talk
them into more. The risk on a job like this isn't building too little — it's
building an agency site nobody asked for.

## What I built

**The page**, in French, structured around one conversion. Sober typography, their
brand colours, restrained motion, and a contact form that's never more than a scroll
away.

**A form that survives the internet.** A public form on a real business site attracts
bots within days, and every junk submission costs the client attention. So: Cloudflare
Turnstile to stop automated submissions without making a human solve puzzles, rate
limiting at five requests per fifteen minutes per IP, input sanitisation on
everything, security headers, and timeouts on every external call so a slow third
party can't hang the request. Submissions arrive as properly formatted email through
Resend.

**A working prototype of what comes next.** They prospect through WhatsApp groups —
the deal flow genuinely happens there — so I built a prototype that reads inbound
group messages, asks Claude to classify each one and propose a single CRM action, and
presents it to the owner to approve or discard. It sits alongside a CRM interface
covering inbox, leads, deals, properties, contacts, calendar and reports.

## Decisions worth explaining

**The CRM runs on demonstration data, and the site says so.** It's a prototype for
the client to react to, not a shipped system, and its own documentation states that
plainly. It's much cheaper to argue about a pipeline you can click through than one
described in a document — but only if nobody mistakes it for the real thing.

**The WhatsApp integration is honest about a hard constraint.** Group messages can't
be received through Meta's standard Cloud API at a small business's volume — group
support is gated to very high-volume accounts. The practical route is a third-party
provider that links a number and forwards messages to a webhook. Rather than bet on
one, I built the webhook provider-agnostic: each provider is a single adapter
function, and choosing one later changes nothing downstream. Finding that limit early
is worth more than a demo that quietly assumes it away.

**AI proposes; the owner decides.** Every classification produces a suggested action
for a human to approve. And with no API key configured, the analysis falls back to a
deterministic keyword heuristic — so the whole pipeline is testable at no cost and
zero network calls, and the client isn't paying for tokens to try it out.

## The result

Collabimmo got exactly the page they asked for, with the unglamorous parts — spam,
abuse, deliverability — handled properly. And they have something concrete to point
at when deciding whether the WhatsApp prospecting work is worth doing for real.
