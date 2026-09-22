// What a deal is made of.
//
// A deal used to be a euro figure with decorations: the value was the deal, and
// equity, commission and barter hung off it. That shape is wrong for how the
// work is actually sold — an engagement paid in a stake, or in a cut of the
// client's revenue, or in work traded for work, is a whole deal with no euro
// figure anywhere in it, and the model nagged for one.
//
// So a deal is **components**: cash, barter, equity, commission. Each is
// independent, none gates another, and a deal is *set* when at least one
// exists. This module is the one place that answers "what is this deal made
// of" — the profile, the list row, the badges and the totals all read it
// instead of each re-deriving an answer from `value_minor`.
//
// The columns behind it are unchanged (see ../schema): `deal_type` survives as
// how to read the € figure — `cash` is money invoiced, `barter` means the same
// number is what a swap is *worth* — which is why cash and barter are the two
// readings of one figure and never both at once.

// ---- Vocabulary ------------------------------------------------------------

// How a lead's `valueMinor` should be read: the whole engagement, or a figure
// charged every month (which is what feeds the recurring-revenue total).
export const billingTypes = ["one_off", "monthly"] as const
export type BillingType = (typeof billingTypes)[number]

export function isBillingType(value: string): value is BillingType {
  return (billingTypes as readonly string[]).includes(value)
}

// How to read the euro figure. `cash` is invoiced and is what the leads list
// totals as pipeline and recurring revenue; `barter` is an exchange of
// services, where the figure is what the swap is worth rather than money
// expected in — so it is totalled separately, never as income.
export const dealTypes = ["cash", "barter"] as const
export type DealType = (typeof dealTypes)[number]

export function isDealType(value: string): value is DealType {
  return (dealTypes as readonly string[]).includes(value)
}

// Percentages — a commission cut or an ownership stake — are stored in basis
// points, so 8.5% survives the round trip that 8.5 as an integer percent would
// lose. 100% is the ceiling for both: you cannot take more of a company than
// there is, and a commission above the whole revenue is a typo.
export const MAX_BPS = 10_000

/** Clamp a basis-point figure into 0…100%, or null for "not part of this deal". */
export function normalizeBps(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return Math.min(MAX_BPS, Math.max(0, Math.round(value)))
}

// ---- Components ------------------------------------------------------------

/**
 * The deal columns of a client row, and nothing else.
 *
 * Structural on purpose: `Client` satisfies it, and so does a form's draft or a
 * list row's projection, so a caller holding a partial view can still ask what
 * the deal is made of. `billingType`/`dealType` are the plain strings the row
 * carries — narrowing them is this module's job, not the caller's.
 */
export type DealTerms = {
  valueMinor: number
  billingType: string
  dealType: string
  barterTerms: string | null
  commissionBps: number | null
  equityBps: number | null
  /** The monthly support line beside a one-off — "one-off + support". 0 = none. */
  supportMinor: number
}

export const dealComponentKinds = [
  "cash",
  "barter",
  "support",
  "equity",
  "commission",
] as const
export type DealComponentKind = (typeof dealComponentKinds)[number]

/** One term of a deal, already narrowed and clamped — a caller renders it
 *  without re-checking the column it came from. */
export type DealComponent =
  | { kind: "cash"; valueMinor: number; billingType: BillingType }
  | { kind: "barter"; valueMinor: number; terms: string | null }
  /** Crash fixes on call, every month, beside a one-off — never a retainer
   *  (that is `cash` with `billingType: monthly`). */
  | { kind: "support"; valueMinor: number }
  | { kind: "equity"; bps: number }
  | { kind: "commission"; bps: number }

/**
 * Every term this deal actually has, in the order they deserve to be read:
 * the euro figure first (cash, or the same figure read in kind), then the
 * stake, then the cut. An empty array means no deal has been agreed yet —
 * which is a fact about the relationship, never a gap to nag about on a lead
 * still being scoped.
 */
export function dealComponents(terms: DealTerms): DealComponent[] {
  const components: DealComponent[] = []

  // Cash and barter are the two readings of one number, so at most one of them
  // is ever a component. Choosing barter is itself a term — the swap is the
  // deal even before anyone puts a figure on what it is worth.
  if (terms.dealType === "barter") {
    components.push({
      kind: "barter",
      valueMinor: Math.max(0, terms.valueMinor),
      terms: terms.barterTerms,
    })
  } else if (terms.valueMinor > 0) {
    components.push({
      kind: "cash",
      valueMinor: terms.valueMinor,
      billingType: isBillingType(terms.billingType) ? terms.billingType : "one_off",
    })
  }

  // The support line rides directly behind the figure it belongs beside: a
  // one-off with a monthly line is one shape ("one-off + support"), read as
  // "€N + €M/mo". Zero means none — a landing page, or a client-owned build.
  if (terms.supportMinor > 0) {
    components.push({ kind: "support", valueMinor: terms.supportMinor })
  }

  // Equity before commission: of everything on a deal, the stake is the one
  // term you never want to skim past.
  const equity = normalizeBps(terms.equityBps) ?? 0
  if (equity > 0) components.push({ kind: "equity", bps: equity })

  const commission = normalizeBps(terms.commissionBps) ?? 0
  if (commission > 0) components.push({ kind: "commission", bps: commission })

  return components
}

/** Is there a deal at all? True the moment any one component exists — no
 *  component is required, and least of all a euro figure. */
export function hasDeal(terms: DealTerms): boolean {
  return dealComponents(terms).length > 0
}

/** The same components keyed by name, null for each term the deal doesn't
 *  have. */
export type DealTermMap = {
  [K in DealComponentKind]: Extract<DealComponent, { kind: K }> | null
}

/**
 * The deal's terms addressed by name rather than read in order — what a caller
 * reaches for when it wants one particular component and not the list:
 * `dealTermsOf(row).cash?.billingType` needs no narrowing at the call site,
 * which is what the money totals are made of.
 */
export function dealTermsOf(terms: DealTerms): DealTermMap {
  const named: DealTermMap = {
    cash: null,
    barter: null,
    support: null,
    equity: null,
    commission: null,
  }
  for (const component of dealComponents(terms)) {
    switch (component.kind) {
      case "cash":
        named.cash = component
        break
      case "barter":
        named.barter = component
        break
      case "support":
        named.support = component
        break
      case "equity":
        named.equity = component
        break
      case "commission":
        named.commission = component
        break
    }
  }
  return named
}

/**
 * The term that gets to be the headline figure — beside the name on a list row,
 * and in mono on the profile masthead.
 *
 * The first component that can actually carry a number, so a deal with cash
 * shows its euros and a deal without shows its strongest percentage instead of
 * nothing. A barter deal nobody has valued yet is skipped here — "in kind" with
 * no amount is a badge, not a figure — and falls through to the stake or the
 * cut, if there is one.
 */
export function dealHeadline(terms: DealTerms): DealComponent | null {
  for (const component of dealComponents(terms)) {
    if (component.kind === "barter" && component.valueMinor <= 0) continue
    return component
  }
  return null
}

/**
 * The headline as text, with the support line folded in where the deal has
 * one: "€N + €M/mo support". The caller formats money (the model has no
 * locale); this only says which two numbers go together, so a one-off with
 * support never reads as a bare one-off on a row.
 */
export function dealHeadlineParts(terms: DealTerms): {
  headline: DealComponent
  supportMinor: number
} | null {
  const headline = dealHeadline(terms)
  if (!headline) return null
  // Support beside a *cash* headline is the "one-off + support" shape. Beside
  // anything else it stands on its own and gets its own badge.
  const supportMinor =
    headline.kind === "cash" ? Math.max(0, terms.supportMinor) : 0
  return { headline, supportMinor }
}
