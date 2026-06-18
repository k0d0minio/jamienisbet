---
title: "Enquiry triage with an AI assistant"
slug: "example-project"
summary: "A sample case study that shows the shape of a write-up. Replace it with real work before publishing."
client: "Sample Client"
year: 2026
services: ["AI feature", "Software build"]
stack: ["Next.js", "TypeScript", "Postgres", "OpenAI"]
outcome: "Cut first-response time on new enquiries from a day to a few minutes."
featured: true
order: 1
---

> **This is a placeholder.** It exists to prove the case-study page renders and to show how to
> structure one. To add a real project, copy this file in `content/work/`, change the frontmatter,
> and write the story. Delete this sample before going live.

## Problem

The client was losing warm leads to slow replies. Enquiries arrived through three different
inboxes, got triaged by hand, and often sat for a day before anyone responded. By then, half
had gone cold.

## Approach

I built a small intake service that does three things:

- **Collects** every enquiry in one place, from web form, email, and referral.
- **Triages** each one with a language model — summarising the request, flagging urgency, and
  drafting a first reply for a human to approve.
- **Routes** the approved reply back out and logs the outcome.

The AI never sends on its own — a person always approves the draft. That kept the tone right
and the trust intact while still removing the slow part.

```ts
// The whole rule was simple: assist, never auto-send.
const draft = await triage(enquiry)
await queueForReview(draft) // a human approves before anything goes out
```

## Result

- First-response time dropped from **~1 day to a few minutes**.
- The owner spends less time sorting and more time on the conversations that matter.
- Nothing goes out without a human nod, so quality stayed high.
