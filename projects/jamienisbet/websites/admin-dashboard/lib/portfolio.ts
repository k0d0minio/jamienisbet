// Where the customer-facing pages this dashboard publishes actually live.
//
// The questionnaire a lead fills in is served by the portfolio (it already has
// the brand chrome and a server action writing to `biz.clients`), so the
// dashboard has to be able to name a URL on a host it doesn't run on. Set
// PORTFOLIO_BASE_URL in the dashboard's environment to point at a preview
// deployment; the production domain is the default.

const DEFAULT_BASE = "https://jamienisbet.com"

function base(): string {
  const configured = process.env.PORTFOLIO_BASE_URL?.trim()
  return (configured || DEFAULT_BASE).replace(/\/+$/, "")
}

/** The full, pasteable URL for a form link token — what the copy button puts on
 * the clipboard. Per the estate's "no outbound action without review" rule this
 * is as far as the dashboard goes: the email around it is written by a human. */
export function formLinkUrl(token: string): string {
  return `${base()}/f/${token}`
}
