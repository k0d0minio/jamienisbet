import Link from "next/link"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@jamie-nisbet/ui"
import {
  listContactSubmissions,
  listReferralLeads,
} from "@jamie-nisbet/services"

// DB reads must run per request.
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let contactCount = 0
  let referralCount = 0
  let openReferrals = 0
  let error: string | null = null

  try {
    const [contacts, referrals] = await Promise.all([
      listContactSubmissions(),
      listReferralLeads(),
    ])
    contactCount = contacts.length
    referralCount = referrals.length
    openReferrals = referrals.filter((r) => r.status === "new").length
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/leads/contact">
            <Card>
              <CardHeader>
                <CardDescription>Contact submissions</CardDescription>
                <CardTitle className="text-3xl">{contactCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/leads/referrals">
            <Card>
              <CardHeader>
                <CardDescription>Referral leads</CardDescription>
                <CardTitle className="text-3xl">{referralCount}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Card>
            <CardHeader>
              <CardDescription>Open referrals (new)</CardDescription>
              <CardTitle className="text-3xl">{openReferrals}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Leads captured by the portfolio and referral forms land here. Billing,
          invoicing, and proposals will follow as new sections.
        </CardContent>
      </Card>
    </div>
  )
}
