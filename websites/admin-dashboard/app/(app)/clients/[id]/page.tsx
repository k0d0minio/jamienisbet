import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { getClient } from "@jamie-nisbet/services"

import { ClientActions } from "@/components/client-actions"
import { ClientProfileForm } from "@/components/client-profile-form"
import { ClientStatusSelect } from "@/components/client-status-select"
import { formatDateTime, formatServiceId } from "@/lib/format"

export const metadata: Metadata = { title: "Client" }
export const dynamic = "force-dynamic"

function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact form"
  if (source === "referral") return "Referral"
  return "Manual"
}

// A read-only line in the intake card; renders "—" for anything unset.
function Detail({ label, children }: { label: string; children?: React.ReactNode }) {
  const empty =
    children === null || children === undefined || children === "" || children === "—"
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        {empty ? <span className="text-muted-foreground">—</span> : children}
      </dd>
    </div>
  )
}

// A roadmap section — the pipeline surfaces that get built onto the profile next
// (see the services README). Shown as a labelled, clearly "not yet" placeholder
// so the workflow reads end-to-end even before each piece lands.
function ComingSoon({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline">Coming soon</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const archived = client.archivedAt !== null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/clients"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Clients
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {archived ? <Badge variant="outline">Archived</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <ClientStatusSelect id={client.id} value={client.status} />
          <ClientActions id={client.id} archived={archived} redirectOnDelete />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editable profile — the record grows here. */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Contact details and working notes. Provenance stays read-only in Intake.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientProfileForm client={client} />
          </CardContent>
        </Card>

        {/* Read-only intake provenance. */}
        <Card>
          <CardHeader>
            <CardTitle>Intake</CardTitle>
            <CardDescription>How this client came in.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Detail label="Source">
                <Badge variant="secondary">{sourceLabel(client.source)}</Badge>
              </Detail>
              <Detail label="Received">{formatDateTime(client.createdAt)}</Detail>
              {client.source === "portfolio" ? (
                <Detail label="Service">
                  {client.service ? (
                    <Badge variant="secondary">
                      {formatServiceId(client.service)}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </Detail>
              ) : null}
              {client.source === "referral" ? (
                <Detail label="Referral code">
                  {client.referralCode ? (
                    <span className="font-mono">{client.referralCode}</span>
                  ) : (
                    "—"
                  )}
                </Detail>
              ) : null}
              <Detail label="Budget">{client.budget}</Detail>
              <Detail label="Preferred call time">
                {formatDateTime(client.preferredCallTime)}
              </Detail>
              <Detail label="Intake message">
                {client.intakeMessage ? (
                  <p className="whitespace-pre-wrap">{client.intakeMessage}</p>
                ) : (
                  "—"
                )}
              </Detail>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* The pipeline the profile gets fleshed out with, intake → delivery. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ComingSoon
          title="Projects"
          description="Scope and track delivery for this client."
        />
        <ComingSoon
          title="Quotes & proposals"
          description="Draft, send, and track quotes and proposals."
        />
        <ComingSoon
          title="Invoices"
          description="Raise and reconcile invoices from Invoices (Stripe)."
        />
      </div>
    </div>
  )
}
