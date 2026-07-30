---
slug: vine-cliff-vineyards
title: "A 170-year-old estate, taking bookings on its own terms"
summary: "Three heritage buildings on Lake Erie, rented weekly, by the weekend and for events. I built the booking platform and the back office behind it — so the owner approves requests instead of chasing calendars."
client: "Vine Cliff Vineyards"
year: 2026
services:
  - Software engineering
  - AI & non-AI automation
stack:
  - Next.js
  - TypeScript
  - Neon Postgres
  - Drizzle ORM
  - Resend
  - Vercel
outcome: "One system that runs the whole estate — requests, approvals, calendars and guest email"
featured: true
order: 1
# CONFIRM before publishing — is the site live, and at which domain?
# url: https://
---

## The problem

Vine Cliff Vineyards is an estate on the shores of Lake Erie in Brocton, New York:
a farmhouse, a carriage house and a barn, each over 170 years old, rented by the
week, by the weekend, and for events — or all at once, as the whole property.

That mix is what makes the place special, and it's also what makes it awkward to
book. The three buildings aren't independent: the barn and a whole-estate booking
take over everything. Availability lives in more than one place once a property is
also listed on the big rental sites. And the owner didn't want an instant-checkout
site — for a wedding on a heritage estate, they want to see who's coming and what
they're planning before saying yes.

## What I built

A request-to-book platform, plus the admin that runs it.

- **Every space has its own page** with a live availability calendar, a booking
  form, and an estimate that adds up as you pick dates — nightly and weekly rates
  plus the cleaning fee. Nothing is charged online.
- **Requests arrive pending.** Only approved bookings block the calendar. The owner
  approves (adjusting the final price and deposit if the enquiry warrants it),
  declines, or cancels. Guests are emailed at every step and get a private status
  page on a tokenised link, where they can withdraw a request or ask to cancel.
- **Availability rules are per space and editable** — minimum stay, turnover buffer
  between bookings, minimum lead time, how far ahead people can book, party-size
  caps. The barn and the whole-estate package reserve the entire property: they
  block every other space, and they only show as available when everything is free.
  That rule is overridable at approval, because sometimes the owner knows better
  than the software.
- **Private iCal feeds per space.** Subscribe from Google Calendar, or paste the
  URL into Airbnb or VRBO, and dates booked here block there too. No double
  bookings, no manual copying.
- **A back office that covers the real day**: live dashboard, a booking pipeline
  with search, manual entry for the people who still phone, a month calendar across
  all spaces with blackout dates, a guests CRM with notes and history, an enquiries
  inbox with one-click convert-to-booking, and a spaces editor so copy, photos,
  rates and rules change without me.

## Decisions worth explaining

**Request-to-book, not instant checkout.** This was the client's call and I think
it's the right one for the property. It also meant payments could stay manual for
launch — quoted versus final total, deposit, unpaid through to refunded. The schema
is built for Stripe, so card payments are a small piece of work when they want it,
not a rewrite.

**The booking logic is tested, the rest isn't.** Dates, pricing and availability
have unit tests, because those are the rules that cost real money when they're
wrong. I spent the testing effort there rather than spreading it thin.

**Migrations run themselves.** Every merge to the main branch applies pending
database migrations to production automatically, serialised so two runs never
collide. It's a small piece of plumbing that removes a whole category of "the site
broke after a deploy".

**Security stays boring.** Each person has their own account, passwords are stored
only as scrypt hashes, and every admin route is checked at the edge against a
signed cookie before it touches the database.

## The result

The estate runs from one place. Requests come in, the owner reviews them, approved
dates propagate to every calendar the property is listed on, and guests get told
what's happening without anyone writing an email by hand.
