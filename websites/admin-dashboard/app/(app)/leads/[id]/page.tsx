import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChevronLeft, Mail, MessageCircle } from "lucide-react"

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import {
  getClient,
  listFormLinksForClient,
  listOpenTasksForClient,
  type Client,
} from "@jamie-nisbet/services"

import { AppScreen } from "@/components/app-screen"
import { ClientActions } from "@/components/client-actions"
import { ViewTransitionLink } from "@/components/view-transition-link"
import { ConvertFlow } from "@/components/convert-flow"
import { DisclosureCard } from "@/components/disclosure-card"
import { LeadContactCard } from "@/components/lead-contact-card"
import { LeadDealCard } from "@/components/lead-deal-card"
import { LeadNotesCard } from "@/components/lead-notes-card"
import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStatusSelect } from "@/components/client-status-select"
import { ClientStripeLink } from "@/components/client-stripe-link"
import { DealBadges } from "@/components/deal-badges"
import { FoldCard } from "@/components/fold-card"
import { FormLinks } from "@/components/form-links"
import { MarkTouchedButton } from "@/components/mark-touched-button"
import { TaskList } from "@/components/task-list"
import { WorkStartedButton } from "@/components/work-started-button"
import {
  daysSince,
  formatDate,
  formatDateTime,
  formatServiceId,
  waitingLabel,
  whatsappUrl,
} from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"
import { listOnboardingForms } from "@/lib/onboarding"

export const metadata: Metadata = { title: "Lead" }
export const dynamic = "force-dynamic"

// One person, ordered by what you actually do on a phone: reach them, say you
// worked them, move their status, write a note. The record itself — contact,
// deal, notes — reads as facts on cards, each edited in its own bottom sheet,
// never as a wall of input fields parked in the middle of the page. Everything
// that is reference (how they came in) or rare and destructive (archive,
// delete) sits at the bottom, folded. On a wide screen the same blocks lay out
// in two columns.

// What a converted lead is still missing. Each gap is a downstream breakage —
// no repo means invisible on the tickets board, no value means the header money
// numbers lie, no Stripe means the first invoice stalls on plumbing — so anyone
// on the `client` rung wears these until the pieces exist. Nothing here is a
// status: the ladder says the deal is agreed, these say the plumbing is done.
function conversionGaps(client: Client): string[] {
  const gaps: string[] = []
  if (!client.githubRepo) gaps.push("no delivery repo")
  if (client.valueMinor <= 0) gaps.push("no deal value")
  if (!client.stripeCustomerId) gaps.push("no Stripe customer")
  return gaps
}

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

  // The questionnaire library (markdown in git) and this lead's sent links (rows
  // in Neon) are independent reads — one is what *can* be sent, the other what
  // already was — so they go together rather than in series. The library is
  // scoped to this lead: the house forms, plus any in their own delivery repo.
  const [rawTasks, formLinks, formLibrary] = await Promise.all([
    listOpenTasksForClient(client.id),
    listFormLinksForClient(client.id),
    listOnboardingForms(client.githubRepo),
  ])

  // Every todo here is this lead's, so the list is rendered without the lead
  // picker the leads screen carries — the name would be the same on each row.
  const tasks = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    clientId: t.clientId,
    clientName: client.name,
    dueDate: t.dueDate?.toISOString() ?? null,
    overdue: t.dueDate !== null && t.dueDate.getTime() < now,
    completed: false,
  }))

  return {
    client,
    tasks,
    formLinks,
    formLibrary,
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

  const { client, tasks, formLinks, formLibrary, lastWorked } = loaded
  const archived = client.archivedAt !== null

  const isCustomer = client.status === "client"
  const gaps = isCustomer ? conversionGaps(client) : []
  // The Convert card walks the four pieces; it stays up for a customer with
  // gaps (to finish the job) and disappears once conversion is whole.
  const showConvert = !archived && (!isCustomer || gaps.length > 0)

  return (
    // The lead's name is the screen's name: it sets large and collapses into
    // the bar on scroll, with the way back on the bar's leading edge — where a
    // detail view keeps it, rather than as a link the content has to start
    // with. The company rides under it as the subtitle.
    <AppScreen
      title={client.name}
      subtitle={client.company || undefined}
      back={
        // A real target, not a 14px arrow, and tinted the way a back control
        // is on this tier.
        <ViewTransitionLink
          href="/"
          className="-ml-2 inline-flex min-h-app-touch items-center gap-0.5 rounded-app-control pr-2 pl-1 text-app-body text-app-tint transition-colors spring-press active:bg-app-press"
        >
          <ChevronLeft className="size-5" aria-hidden />
          Leads
        </ViewTransitionLink>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-1">
          {archived ? (
            <Badge variant="outline" className="w-fit">
              Archived
            </Badge>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {lastWorked === "today"
              ? "Worked today"
              : `Last worked ${lastWorked} ago`}
          </p>
          {/* The same badges the leads list carries, so what kind of deal this is
              is answered before you scroll to the profile that sets it. */}
          <DealBadges client={client} className="mt-1" />
          {/* Conversion gaps — a client missing pieces says so where the
              eye lands first, because each gap breaks something downstream. */}
          {gaps.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {gaps.map((gap) => (
                <Badge key={gap} variant="warning">
                  {gap}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* The things you came here to do. A rail rather than a wrapping row, so
            it stays one line on any width; on a phone these are the whole point
            of opening a lead on your phone in the first place. */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0 sm:pb-0">
          {client.phone ? (
            <Button asChild variant="outline" className="shrink-0">
              {/* WhatsApp chat, not a call — tapping a lead's number should open
                  the conversation, never surprise-dial them. */}
              <a
                href={whatsappUrl(client.phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp
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
          <WorkStartedButton
            id={client.id}
            startedOn={
              client.workStartedAt ? formatDate(client.workStartedAt) : null
            }
          />
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
            {/* Conversion as one act: the four steps that used to be four
                separate taps, walked in order, each skippable but explicit.
                Composes the same actions the individual controls below use. */}
            {showConvert ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isCustomer ? "Finish conversion" : "Convert"}
                  </CardTitle>
                  <CardDescription>
                    {isCustomer
                      ? "A client, but missing pieces — walk the remaining steps."
                      : "Won the work? Walk status, repo, deal terms and Stripe in one pass."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConvertFlow
                    client={{
                      id: client.id,
                      status: client.status,
                      githubRepo: client.githubRepo,
                      githubDefaultBranch: client.githubDefaultBranch,
                      stripeCustomerId: client.stripeCustomerId,
                      valueMinor: client.valueMinor,
                      billingType: client.billingType,
                      dealType: client.dealType,
                      barterTerms: client.barterTerms,
                    }}
                    githubConfigured={isGithubConfigured()}
                    suggestedRepoName={clientSlug(client.name)}
                  />
                </CardContent>
              </Card>
            ) : null}

            {/* The record, read as facts. Contact rows are the actions themselves
                (tap to call, tap to email, copy beside each); the deal is what
                it's worth and how it settles; notes are the running memory. Each
                card edits in its own bottom sheet — how they came in stays
                read-only under Intake. */}
            <LeadContactCard
              client={{
                id: client.id,
                name: client.name,
                company: client.company,
                email: client.email,
                phone: client.phone,
              }}
            />
            <LeadDealCard
              client={{
                id: client.id,
                valueMinor: client.valueMinor,
                billingType: client.billingType,
                dealType: client.dealType,
                barterTerms: client.barterTerms,
                commissionBps: client.commissionBps,
                equityBps: client.equityBps,
              }}
            />
            <LeadNotesCard id={client.id} notes={client.notes} />

            {/* Questionnaires. The link is copied here and emailed by hand — per
                the estate rule, the dashboard never sends anything itself. */}
            <Card>
              <CardHeader>
                <CardTitle>Forms</CardTitle>
                <CardDescription>
                  Send {client.name} a questionnaire from{" "}
                  <code className="rounded-xs bg-muted px-1 py-0.5 text-xs">
                    .icm/onboarding/
                  </code>
                  , then paste the link into an email. Answers come back here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormLinks
                  clientId={client.id}
                  clientRepo={client.githubRepo}
                  links={formLinks}
                  forms={formLibrary.forms}
                  formErrors={formLibrary.errors}
                />
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

          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Where their work lives and how they get billed — plumbing you set
                once, so it sits in the reference column, not between the record
                and the todos. */}
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

            <FoldCard title="Intake" description="How this lead came in.">
              <IntakeDetails client={client} />
            </FoldCard>

            {/* Rare and irreversible — last on the page and folded shut, never
                beside the title where a thumb reaching for the status could
                find it. */}
            <DisclosureCard title="Danger zone" titleClassName="text-destructive">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Archiving takes them off the list and keeps the record. Deleting
                  can&apos;t be undone.
                </p>
                <ClientActions
                  id={client.id}
                  archived={archived}
                  redirectOnDelete
                  className="justify-start"
                />
              </div>
            </DisclosureCard>
          </div>
        </div>
      </div>
    </AppScreen>
  )
}
