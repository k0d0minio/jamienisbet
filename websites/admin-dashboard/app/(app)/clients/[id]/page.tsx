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
import { getClient, listDealsForClient } from "@jamie-nisbet/services"

import { ClientActions } from "@/components/client-actions"
import { ClientProfileForm } from "@/components/client-profile-form"
import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ClientStripeLink } from "@/components/client-stripe-link"
import { DealCreateForm } from "@/components/deal-create-form"
import { formatDateTime, formatServiceId } from "@/lib/format"
import { isGithubConfigured } from "@/lib/github"
import { dealStatusVariant } from "@/lib/kinds"
import { formatMoney } from "@/lib/money"
import { clientSlug } from "@/lib/repo-sync"

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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const deals = await listDealsForClient(client.id)

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
          <CardContent className="flex flex-col gap-4">
            <ClientProfileForm client={client} />
            <div className="border-t pt-4">
              <div className="mb-2 text-xs text-muted-foreground">
                Delivery repo
              </div>
              <ClientRepoLink
                id={client.id}
                githubRepo={client.githubRepo}
                githubDefaultBranch={client.githubDefaultBranch}
                configured={isGithubConfigured()}
                suggestedName={clientSlug(client.name)}
              />
            </div>
            <div className="border-t pt-4">
              <div className="mb-2 text-xs text-muted-foreground">
                Stripe customer
              </div>
              <ClientStripeLink
                id={client.id}
                stripeCustomerId={client.stripeCustomerId}
              />
            </div>
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

      {/* The pipeline itself: each opportunity is a deal, and a deal's page
          runs the three steps — brainstorm & pitch, proposal, get paid — with
          every document reviewed before it moves anything forward. */}
      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <CardDescription>
            One deal per opportunity. Open a deal to run its three steps —
            brainstorm &amp; pitch, proposal, get paid — with every document
            reviewed before anything is sent or invoiced.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {deals.length > 0 ? (
            <ul className="divide-y">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href={`/deals/${deal.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/40"
                  >
                    <span className="text-sm font-medium">{deal.title}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {deal.valueMinor > 0
                          ? formatMoney(deal.valueMinor, "eur")
                          : "—"}
                      </span>
                      <Badge
                        variant={dealStatusVariant(deal.status)}
                        className="capitalize"
                      >
                        {deal.status}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No deals yet — open one to start this client&apos;s pipeline.
            </p>
          )}
          <div className="border-t pt-4">
            <DealCreateForm clientId={client.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
