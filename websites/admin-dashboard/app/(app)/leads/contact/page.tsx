import type { Metadata } from "next"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
} from "@jamie-nisbet/ui"
import {
  listContactSubmissions,
  type ContactSubmission,
} from "@jamie-nisbet/services"

import { ArchiveToggle } from "@/components/archive-toggle"
import { LeadActions } from "@/components/lead-actions"
import { formatDateTime, formatServiceId } from "@/lib/format"

export const metadata: Metadata = { title: "Contact submissions" }
export const dynamic = "force-dynamic"

export default async function ContactLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const archived = (await searchParams).archived === "1"
  let rows: ContactSubmission[] = []
  let error: string | null = null

  try {
    rows = await listContactSubmissions({ archived })
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Contact submissions</h1>
        <ArchiveToggle basePath="/leads/contact" archived={archived} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {archived ? "Nothing archived." : "No submissions yet."}
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
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Message</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3">
                        <a
                          className="underline underline-offset-2"
                          href={`mailto:${row.email}`}
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {row.service ? (
                          <Badge variant="secondary">
                            {formatServiceId(row.service)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-md px-4 py-3 whitespace-pre-wrap">
                        {row.message}
                      </td>
                      <td className="px-4 py-3">
                        <LeadActions
                          id={row.id}
                          kind="contact"
                          archived={archived}
                        />
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
