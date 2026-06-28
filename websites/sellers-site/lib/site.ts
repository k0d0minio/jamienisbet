// Single source of site-level copy and config for the affiliate intake site.
// Facts come from workspaces/lead-generation/references/affiliate-program.md;
// voice follows _config/brand/voice/. Keep copy here so sections stay structural.

export const site = {
  name: "Jamie Nisbet",
  // Shown as the program label, not a job title.
  role: "Affiliate program",
  email: "contact@jamienisbet.com",
  location: "Mafra, Portugal",
  domain: "refer.jamienisbet.com",
  url: "https://refer.jamienisbet.com",
  // Where the main site lives, linked from header/footer.
  mainSiteUrl: "https://jamienisbet.com",
  // One-line description used for metadata and sharing.
  description:
    "Earn 10% sending me web and software work you already talk about. You make the warm intro; I scope, build, and ship. You're paid when the client pays.",
  nav: [
    { label: "How it works", href: "/#how" },
    { label: "What you sell", href: "/#sell" },
    { label: "Seller kit", href: "/#kit" },
    { label: "Partners", href: "/#partners" },
    { label: "FAQ", href: "/#faq" },
  ],
} as const

// How the 10% works — four plain steps, refer → build → pay → payout.
export type Step = {
  icon: "UserPlus" | "Hammer" | "CreditCard" | "BadgeEuro"
  title: string
  description: string
}

export const steps: Step[] = [
  {
    icon: "UserPlus",
    title: "You refer",
    description:
      "Someone you know needs a website or software. You make the intro here with your referral code — that code is what ties the payout to you.",
  },
  {
    icon: "Hammer",
    title: "I scope & build",
    description:
      "I take it from there: I talk to the customer, agree a clear scope and price, and build it. You're not on the hook for any of the delivery.",
  },
  {
    icon: "CreditCard",
    title: "The client pays",
    description:
      "The customer pays my invoice for the work. Simple landing pages start at €200; bigger builds are quoted to fit.",
  },
  {
    icon: "BadgeEuro",
    title: "You're paid 10%",
    description:
      "You get 10% of what I invoice, paid once the client's payment lands — not before. One clear statement per referrer, no chasing.",
  },
]

// What a seller can pitch without checking in, and where to hand over to Jamie.
export type SellPoint = {
  title: string
  description: string
}

export const whatYouSell: SellPoint[] = [
  {
    title: "Landing page + contact form",
    description:
      "The easy sell: a clean, fast one-page site with a contact form, from €200. You can quote anything at or above €200 yourself — no approval needed.",
  },
  {
    title: "Something bigger? Introduce me",
    description:
      "Multi-page sites, web apps, AI features, integrations — these I quote. Just make the intro with your code and I'll take the conversation from there. You still earn your 10%.",
  },
]

// Why a partner organisation should send work this way.
export const partnerPerks: string[] = [
  "Reciprocal referrals — you send web and software work, I send the clients who need what you do.",
  "Built for accountants, print shops, co-working spaces, and agencies who already serve the same customers.",
  "High trust, zero ad spend: your client deals with a named engineer, not a faceless agency.",
  "Same 10% on anything you refer that turns into paid work — attribution carries through your code.",
]

// The seller kit — ready-to-send messages a seller can copy, adapt, and send in
// seconds. `{link}` is replaced at render time with the seller's personal referral
// link, so attribution travels with every share. Keep these in the brand voice:
// plain, warm, no jargon — the seller never has to explain the tech.
export type PitchScript = {
  channel: string
  icon: "MessageCircle" | "Mail" | "Users"
  title: string
  body: string
}

export const pitchScripts: PitchScript[] = [
  {
    channel: "WhatsApp",
    icon: "MessageCircle",
    title: "Quick WhatsApp intro",
    body: "Hey! You mentioned needing a website for the business — I know the right person. Jamie builds clean, fast sites from €200 and handles the whole thing for you. Want me to introduce you? Here's his page: {link}",
  },
  {
    channel: "Email",
    icon: "Mail",
    title: "Warm email introduction",
    body: "Hi [name],\n\nFollowing up on what you said about needing a website — I work with Jamie Nisbet, a software engineer near Lisbon who builds fast, professional sites and looks after the whole thing. One-page sites start at €200; bigger builds are quoted to fit.\n\nYou can read more and reach him here: {link}\n\nHappy to introduce you directly — just say the word.",
  },
  {
    channel: "In person",
    icon: "Users",
    title: "Face-to-face, then follow up",
    body: "\"You know what — I know exactly the right person for that. Jamie builds websites and software, dead easy to deal with, and he'll quote you straight. Let me send you his link.\" Then text them: {link}",
  },
]

// What separates a lead worth sending from a maybe — sellers self-filter, so every
// intro that lands is one Jamie can actually move on. Better leads, not just more.
export const goodLeadSigns: string[] = [
  "They've actually said they need a website, online booking, or some software — not just \"might one day\".",
  "You can name who decides and pays — the owner or a manager, not a vague \"the business\".",
  "There's a reason it's now: a launch, a rebrand, a busy season, or a competitor who just went online.",
  "They have a rough budget in mind, even if it's only \"a few hundred euros\".",
  "You can give a name and a way to reach them — an email or a phone number.",
]

// What the 10% looks like in euros, so the upside is concrete rather than abstract.
// Figures are illustrative; the real payout is always 10% of the actual invoice.
export type EarningExample = {
  work: string
  invoice: string
  youEarn: string
}

export const earningExamples: EarningExample[] = [
  { work: "One-page site + contact form", invoice: "€200", youEarn: "€20" },
  { work: "Small business site, a few pages", invoice: "€800", youEarn: "€80" },
  { work: "Booking system or web app", invoice: "€3,000", youEarn: "€300" },
]

// Short FAQ — the questions sellers and partners actually ask.
export type Faq = {
  q: string
  a: string
}

export const faqs: Faq[] = [
  {
    q: "When do I get paid?",
    a: "When the client's payment reaches me — not when I send the invoice. You get 10% of what I invoice on that project, settled in one clear statement per referrer.",
  },
  {
    q: "What stops two people claiming the same lead?",
    a: "Your referral code. The first valid code logged against a new customer wins. If two codes land on the same customer, it surfaces for me to sort out fairly — so always log the lead here first.",
  },
  {
    q: "What can I quote myself?",
    a: "Landing pages with a contact form, at €200 or more — quote those freely. Anything more involved (multiple pages, an app, AI, integrations), just introduce me and I'll quote it.",
  },
  {
    q: "Do I have to understand the tech?",
    a: "No. Your job is the warm intro and the simple landing-page sale. I handle scope, price, build, and support. If a customer asks something technical, point them to me.",
  },
]
