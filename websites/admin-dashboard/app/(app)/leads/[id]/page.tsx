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
import { getClient, listOpenTasksForClient } from "@jamie-nisbet/services"

import { ClientActions } from "@/components/client-actions"
import { ClientProfileForm } from "@/components/client-profile-form"
import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ClientStripeLink } from "@/components/client-stripe-link"
import { MarkTouchedButton } from "@/components/mark-touched-button"
import { TaskList } from "@/components/task-list"
import {
  daysSince,
  formatDateTime,
  formatServiceId,
  waitingLabel,
} from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"

export const metadata: Metadata = { title: "Lead" }
export const dynamic = "force-dynamic"

function sourceLabel(source: string): string {
  if (source === "portfolio") return "Contact form"
  if (source === "referral") return "Referral"
  return "Added by hand"
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

// Read outside the component so the render stays pure: `now` is sampled once
// here, not during render (which the react-hooks/purity rule forbids).
async function loadLead(id: string) {
  const now = Date.now()
  const client = await getClient(id)
  if (!client) return null

  const tasks = (await listOpenTasksForClient(client.id)).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate?.toISOString() ?? null,
    overdue: t.dueDate !== null && t.dueDate.getTime() < now,
    completed: false,
  }))

  return {
    client,
    tasks,
    lastWorked: waitingLabel(
      daysSince(client.lastTouchedAt ?? client.createdAt, now)
    ),
  }
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const loaded = await loadLead(id)
  if (!loaded) notFound()

  const { client, tasks, lastWorked } = loaded
  const archived = client.archivedAt !== null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Leads
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {archived ? <Badge variant="outline">Archived</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MarkTouchedButton id={client.id} lastWorked={lastWorked} />
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
              Contact details, what the work is worth, and working notes. How
              they came in stays read-only under Intake.
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
            <CardDescription>How this lead came in.</CardDescription>
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
              <Detail label="Budget indicated">{client.budget}</Detail>
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

      {/* Todos hanging off this lead — the same list as the leads screen,
          filtered to this one, so a "chase them Tuesday" lives with the person
          it is about. */}
      <Card>
        <CardHeader>
          <CardTitle>Todos</CardTitle>
          <CardDescription>
            Open todos for {client.name}. They also show on the leads screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList clientId={client.id} tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  )
}
