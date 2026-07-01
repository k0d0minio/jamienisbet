import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
} from "@jamie-nisbet/ui"
import {
  listReferralLeads,
  type ReferralLead,
} from "@jamie-nisbet/services"

import { StatusSelect } from "@/components/status-select"
import { formatDateTime } from "@/lib/format"

export const metadata: Metadata = { title: "Referral leads" }
export const dynamic = "force-dynamic"

export default async function ReferralLeadsPage() {
  let rows: ReferralLead[] = []
  let error: string | null = null

  try {
    rows = await listReferralLeads()
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Referral leads</h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No referral leads yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Received</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Need</th>
                    <th className="px-4 py-3 font-medium">Budget</th>
                    <th className="px-4 py-3 font-medium">Call time</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono">{row.referralCode}</td>
                      <td className="px-4 py-3 font-medium">{row.customerName}</td>
                      <td className="px-4 py-3">
                        <div>
                          <a
                            className="underline underline-offset-2"
                            href={`tel:${row.customerPhone}`}
                          >
                            {row.customerPhone}
                          </a>
                        </div>
                        {row.customerEmail ? (
                          <a
                            className="text-muted-foreground underline underline-offset-2"
                            href={`mailto:${row.customerEmail}`}
                          >
                            {row.customerEmail}
                          </a>
                        ) : null}
                      </td>
                      <td className="max-w-xs px-4 py-3 whitespace-pre-wrap">
                        {row.need}
                      </td>
                      <td className="px-4 py-3">{row.budget || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDateTime(row.preferredCallTime)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect id={row.id} value={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
