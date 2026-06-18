// Single source of site-level copy and config. Facts come from
// _config/business/ (contact.md, rates.md); voice follows _config/brand/voice/.
// Keep copy here so pages stay structural and easy to re-word.

export const site = {
  name: "Jamie Nisbet",
  role: "Software engineer & AI consultant",
  email: "contact@jamienisbet.com",
  location: "Portugal",
  domain: "jamienisbet.com",
  url: "https://jamienisbet.com",
  // One-line description used for metadata and the OG image.
  description:
    "A senior engineer who builds AI and software that takes the admin off your plate — on clean architecture built to scale. Clear scope, clear price, no surprises.",
  nav: [
    { label: "Work", href: "/#work" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],
} as const

// Services described by outcome, not product names (per voice/vocabulary).
// Each maps to a messaging pillar.
export type Service = {
  icon: "Sparkles" | "AppWindow" | "Workflow" | "Compass"
  title: string
  description: string
}

export const services: Service[] = [
  {
    icon: "Sparkles",
    title: "AI features",
    description:
      "Practical AI wired into the tools you already use — it handles the repetitive work so your team doesn't. Built and measured against a real outcome, not a demo.",
  },
  {
    icon: "AppWindow",
    title: "Software & websites",
    description:
      "Web apps and sites built to last: fast, accessible, and easy to change. Clean architecture today means cheap changes tomorrow.",
  },
  {
    icon: "Workflow",
    title: "Automations",
    description:
      "Cut the manual work. I connect your tools and let the boring parts run themselves, so your hours go back to the business and its customers.",
  },
  {
    icon: "Compass",
    title: "Advisory",
    description:
      "A senior engineer on call — architecture reviews, technical due diligence, or a straight second opinion before you commit.",
  },
]

// "How I work" — reinforces pillars 3 (clear scope/price) and 4 (small shop, serious delivery).
export const howIWork: string[] = [
  "You talk to the person building it — no agency layers, no account managers.",
  "Clear scope and a clear price before we start; changes are a conversation, not a hidden line item.",
  "I'm honest about trade-offs, cost, and what I don't know — I'd rather under-promise.",
  "Built on clear, documented architecture — it scales as you grow and it's yours to keep, no lock-in.",
  "One person you can reach, with contractors on standby for bigger builds.",
]

// Outcomes — what working together changes, framed for both audiences:
// the business owner (less admin) and the technical buyer (systems that last).
export type Outcome = {
  title: string
  description: string
}

export const outcomes: Outcome[] = [
  {
    title: "Your time back",
    description:
      "The admin and busywork that eats your week, handled — so your hours go to customers and growth.",
  },
  {
    title: "Systems that last",
    description:
      "Clean, documented, well-defined architecture that scales as you grow — not a demo that breaks in a month.",
  },
  {
    title: "You stay in the loop",
    description:
      "One senior engineer you can reach, honest about trade-offs and cost, with the whole build yours to keep.",
  },
]
