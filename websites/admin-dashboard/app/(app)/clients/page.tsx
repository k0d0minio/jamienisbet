import type { Metadata } from "next"
import Link from "next/link"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
} from "@jamie-nisbet/ui"
import { listClients, type Client } from "@jamie-nisbet/services"

import { ArchiveToggle } from "@/components/archive-toggle"
import { ClientActions } from "@/components/client-actions"
import { ClientStatusSelect } from "@/components/client-status-select"
import { formatDateTime } from "@/lib/format"

export const metadata: Metadata = { title: "Clients" }
export const dynamic = "force-dynamic"

// Every intake — portfolio contact or sellers referral — is a client. Source
// tells them apart at a glance.
function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact"
  if (source === "referral") return "Referral"
  return "Manual"
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const archived = (await searchParams).archived === "1"
  let rows: Client[] = []
  let error: string | null = null

  try {
    rows = await listClients({ archived })
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not reach the database."
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <ArchiveToggle basePath="/clients" archived={archived} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Database unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {archived ? "Nothing archived." : "No clients yet."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll. */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/clients/${row.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.company ? (
                        <div className="text-sm text-muted-foreground">
                          {row.company}
                        </div>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {sourceLabel(row.source)}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    {row.email ? (
                      <div>
                        <a
                          className="underline underline-offset-2"
                          href={`mailto:${row.email}`}
                        >
                          {row.email}
                        </a>
                      </div>
                    ) : null}
                    {row.phone ? (
                      <a
                        className="text-muted-foreground underline underline-offset-2"
                        href={`tel:${row.phone}`}
                      >
                        {row.phone}
                      </a>
                    ) : null}
                    {!row.email && !row.phone ? (
                      <span className="text-muted-foreground">
                        No contact info
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Received {formatDateTime(row.createdAt)}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <ClientStatusSelect id={row.id} value={row.status} />
                    <ClientActions id={row.id} archived={archived} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table. */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0 align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/clients/${row.id}`}
                            className="font-medium underline-offset-2 hover:underline"
                          >
                            {row.name}
                          </Link>
                          {row.company ? (
                            <div className="text-muted-foreground">{row.company}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{sourceLabel(row.source)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {row.email ? (
                            <div>
                              <a
                                className="underline underline-offset-2"
                                href={`mailto:${row.email}`}
                              >
                                {row.email}
                              </a>
                            </div>
                          ) : null}
                          {row.phone ? (
                            <a
                              className="text-muted-foreground underline underline-offset-2"
                              href={`tel:${row.phone}`}
                            >
                              {row.phone}
                            </a>
                          ) : null}
                          {!row.email && !row.phone ? (
                            <span className="text-muted-foreground">—</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <ClientStatusSelect id={row.id} value={row.status} />
                        </td>
                        <td className="px-4 py-3">
                          <ClientActions id={row.id} archived={archived} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
