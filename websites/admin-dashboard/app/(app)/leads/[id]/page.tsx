import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Badge, GroupedList, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"
import {
  clientStatusLabel,
  getClient,
  listFormLinksForClient,
  listOpenTasksForClient,
  type Client,
} from "@jamie-nisbet/services"

import { AppProfileScreen } from "@/components/app-screen"
import { ClientActions } from "@/components/client-actions"
import { ViewTransitionLink } from "@/components/view-transition-link"
import { DealBadges, hasDealTerms } from "@/components/deal-badges"
import { FormLinks } from "@/components/form-links"
import { LeadActionRow } from "@/components/lead-action-row"
import { LeadContactCard } from "@/components/lead-contact-card"
import { LeadConvertRow } from "@/components/lead-convert-row"
import { LeadDealCard } from "@/components/lead-deal-card"
import { LeadDeliveryCard } from "@/components/lead-delivery-card"
import { LeadIntake } from "@/components/lead-intake"
import { LeadNotesCard } from "@/components/lead-notes-card"
import { LeadStatusRow } from "@/components/lead-status-row"
import { LeadTodos } from "@/components/lead-todos"
import { daysSince, formatDate, waitingLabel } from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"
import { formatMoney } from "@/lib/money"
import { listOnboardingForms } from "@/lib/onboarding"

export const metadata: Metadata = { title: "Lead" }
export const dynamic = "force-dynamic"

// One person, in the Contacts idiom: they are the masthead — disc, name, what
// they are, what they're worth — the five things you'd open this page on a
// phone to do are discs directly under it, and the record itself is grouped
// inset sections you scan rather than read. Every section edits in its own
// bottom sheet, posting the same scoped server actions as before; nothing on
// this page is a wall of input fields.
//
// The order down the page is working order: where they stand, how to reach
// them, what the deal is, what you know, what you've asked them, where the
// work lives, what's outstanding — then the reference (how they came in,
// folded) and finally the two red rows nothing else should sit near.

// What a converted lead is still missing. Each gap is a downstream breakage —
// no repo means invisible on the tickets board, no value means the header money
// numbers lie, no Stripe means the first invoice stalls on plumbing — so anyone
// on the `active` rung wears these until the pieces exist. Nothing here is a
// status: the ladder says the deal is agreed, these say the plumbing is done.
function conversionGaps(client: Client): string[] {
  const gaps: string[] = []
  if (!client.githubRepo) gaps.push("no delivery repo")
  if (client.valueMinor <= 0) gaps.push("no deal value")
  if (!client.stripeCustomerId) gaps.push("no Stripe customer")
  return gaps
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

  // Every todo here is this lead's, so the rows carry no name and no lead
  // picker — it would be the same name on each one.
  const tasks = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
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

  const isActiveClient = client.status === "active"
  const gaps = isActiveClient ? conversionGaps(client) : []
  // The Convert row walks the four pieces; it stays up for a client with
  // gaps (to finish the job) and disappears once conversion is whole.
  const showConvert = !archived && (!isActiveClient || gaps.length > 0)

  // The masthead reads the status through the one label lookup — the stored
  // strings ("not_won", "discussing") are never capitalised into the UI.
  const statusLabel = clientStatusLabel(client.status)
  const money = client.valueMinor > 0 ? formatMoney(client.valueMinor, "eur") : null

  return (
    <AppProfileScreen
      name={client.name}
      // Who they are, in one quiet line: the company they're from and where
      // they stand. The status is also the first row below, where it can be
      // changed — here it is only being said.
      meta={[client.company, statusLabel].filter(Boolean).join(" · ")}
      // The figure that qualifies the whole record, in mono beside the name.
      figure={money ?? undefined}
      figureLabel={
        money ? (client.billingType === "monthly" ? "Per month" : "Value") : undefined
      }
      badges={
        archived || gaps.length > 0 || hasDealTerms(client) ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {archived ? <Badge variant="outline">Archived</Badge> : null}
            {/* The same badges the leads list carries, so what kind of deal
                this is is answered before you scroll. */}
            <DealBadges client={client} />
            {/* Conversion gaps — a client missing pieces says so where the eye
                lands first, because each gap breaks something downstream. */}
            {gaps.map((gap) => (
              <Badge key={gap} variant="warning">
                {gap}
              </Badge>
            ))}
          </div>
        ) : undefined
      }
      back={
        // A real target, not a 14px arrow, and tinted the way a back control
        // is on this tier.
        <ViewTransitionLink
          href="/leads"
          className="-ml-2 inline-flex min-h-app-touch items-center gap-0.5 rounded-app-control pr-2 pl-1 text-app-body text-app-tint transition-colors spring-press active:bg-app-press"
        >
          <ChevronLeft className="size-5" aria-hidden />
          Leads
        </ViewTransitionLink>
      }
      actions={
        <LeadActionRow
          id={client.id}
          phone={client.phone}
          email={client.email}
          lastWorked={lastWorked}
          workStartedOn={
            client.workStartedAt ? formatDate(client.workStartedAt) : null
          }
        />
      }
    >
      {/* One codepath from phone to laptop: the same groups, in the same
          order, laid into two columns once there is width for them. The
          sections never split across a column, so a group is always read as
          one slab. */}
      <GroupedList className="lg:block lg:columns-2 lg:[&>section]:mb-app-section lg:[&>section]:break-inside-avoid">
        {/* Where they stand. No header — this group is the identity's
            continuation, not a topic of its own. */}
        <GroupedSection>
          <LeadStatusRow id={client.id} value={client.status} />
          <GroupedRow
            label="Last worked"
            chevron={false}
            value={
              lastWorked === "today" ? (
                "Today"
              ) : (
                <>
                  <span className="font-mono">{lastWorked}</span> ago
                </>
              )
            }
          />
          {showConvert ? (
            <LeadConvertRow
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
              gaps={gaps}
            />
          ) : null}
        </GroupedSection>

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

        <FormLinks
          clientId={client.id}
          clientName={client.name}
          clientRepo={client.githubRepo}
          links={formLinks}
          forms={formLibrary.forms}
          formErrors={formLibrary.errors}
        />

        <LeadDeliveryCard
          id={client.id}
          name={client.name}
          githubRepo={client.githubRepo}
          githubDefaultBranch={client.githubDefaultBranch}
          githubConfigured={isGithubConfigured()}
          suggestedRepoName={clientSlug(client.name)}
          stripeCustomerId={client.stripeCustomerId}
        />

        <LeadTodos
          clientId={client.id}
          clientName={client.name}
          tasks={tasks}
        />

        <LeadIntake client={client} />

        {/* Rare and irreversible — last on the page, in red, and nowhere near
            the thumb reaching for the status at the top. */}
        <GroupedSection
          header="Danger zone"
          footer="Archiving takes them off the list and keeps the record. Deleting can't be undone."
        >
          <ClientActions id={client.id} archived={archived} grouped redirectOnDelete />
        </GroupedSection>
      </GroupedList>
    </AppProfileScreen>
  )
}
