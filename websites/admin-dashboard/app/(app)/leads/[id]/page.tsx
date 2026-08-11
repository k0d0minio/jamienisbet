import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Mail, Phone } from "lucide-react"

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import { getClient, listOpenTasksForClient, type Client } from "@jamie-nisbet/services"

import { ClientActions } from "@/components/client-actions"
import { ClientProfileForm } from "@/components/client-profile-form"
import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ClientStripeLink } from "@/components/client-stripe-link"
import { FoldCard } from "@/components/fold-card"
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

// One person, ordered by what you actually do on a phone: reach them, say you
// worked them, move their status, write a note. Everything that is reference
// (how they came in) or rare and destructive (archive, delete) sits at the
// bottom, and the intake block folds away on a small screen. On a wide screen
// the same blocks lay out in two columns.

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

// Read-only provenance. Pulled out so FoldCard can render it as a folded
// <details> on a phone and an open card on a wide screen.
function IntakeDetails({ client }: { client: Client }) {
  return (
    <dl className="grid gap-4">
      <Detail label="Source">
        <Badge variant="secondary">{sourceLabel(client.source)}</Badge>
      </Detail>
      <Detail label="Received">{formatDateTime(client.createdAt)}</Detail>
      {client.source === "portfolio" ? (
        <Detail label="Service">
          {client.service ? (
            <Badge variant="secondary">{formatServiceId(client.service)}</Badge>
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
  )
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
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Back out of the detail view — a real target, not a 14px arrow. */}
      <Link
        href="/"
        className="-ml-2 inline-flex h-11 w-fit items-center gap-1 rounded-sm pr-3 pl-2 text-sm text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Leads
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl leading-tight font-semibold">{client.name}</h1>
          {archived ? <Badge variant="outline">Archived</Badge> : null}
        </div>
        {client.company ? (
          <p className="text-sm text-muted-foreground">{client.company}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {lastWorked === "today"
            ? "Worked today"
            : `Last worked ${lastWorked} ago`}
        </p>
      </div>

      {/* The things you came here to do. A rail rather than a wrapping row, so
          it stays one line on any width; on a phone these are the whole point
          of opening a lead on your phone in the first place. */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0 sm:pb-0">
        {client.phone ? (
          <Button asChild variant="outline" className="shrink-0">
            <a href={`tel:${client.phone}`}>
              <Phone />
              Call
            </a>
          </Button>
        ) : null}
        {client.email ? (
          <Button asChild variant="outline" className="shrink-0">
            <a href={`mailto:${client.email}`}>
              <Mail />
              Email
            </a>
          </Button>
        ) : null}
        <MarkTouchedButton id={client.id} lastWorked={lastWorked} />
      </div>

      {/* Status gets its own row: it's the field changed most often and the one
          worth hitting without aiming. */}
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground sm:w-fit sm:gap-6">
        <span className="text-sm font-medium">Status</span>
        <ClientStatusSelect
          id={client.id}
          value={client.status}
          className="w-40"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-2">
          {/* Editable profile — the record grows here. */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Contact details, what the work is worth, and working notes. How
                they came in stays read-only under Intake.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientProfileForm client={client} />
            </CardContent>
          </Card>

          {/* Todos hanging off this lead — the same list as the leads screen,
              filtered to this one, so a "chase them Tuesday" lives with the
              person it is about. */}
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

          {/* Where their work lives and how they get billed. */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery &amp; billing</CardTitle>
              <CardDescription>
                The repo their work lives in, and their Stripe customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
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
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          <FoldCard title="Intake" description="How this lead came in.">
            <IntakeDetails client={client} />
          </FoldCard>

          {/* Rare and irreversible — last on the page, never beside the title
              where a thumb reaching for the status could find it. */}
          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Archiving takes them off the list and keeps the record. Deleting
                can&apos;t be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientActions
                id={client.id}
                archived={archived}
                redirectOnDelete
                className="justify-start"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
