import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Badge, GroupedList, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"
import {
  clientStatusLabel,
  getClient,
  listFormLinksForClient,
  listOpenTasksForClient,
} from "@jamie-nisbet/services"

import { AppProfileScreen } from "@/components/app-screen"
import { ClientActions } from "@/components/client-actions"
import { ViewTransitionLink } from "@/components/view-transition-link"
import { DealBadges } from "@/components/deal-badges"
import { FormLinks } from "@/components/form-links"
import { LeadActionRow } from "@/components/lead-action-row"
import { LeadContactCard } from "@/components/lead-contact-card"
import { LeadDealCard } from "@/components/lead-deal-card"
import { LeadIntake } from "@/components/lead-intake"
import { LeadLinks } from "@/components/lead-links"
import { LeadNotesCard } from "@/components/lead-notes-card"
import { LeadSegments } from "@/components/lead-segments"
import { LeadStatusRow } from "@/components/lead-status-row"
import { LeadTodos } from "@/components/lead-todos"
import { daysSince, formatDate, waitingLabel } from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"
import {
  DEFAULT_LEAD_SEGMENT,
  isLeadSegmentKey,
  type LeadSegmentKey,
} from "@/lib/lead-segments"
import { dealFigure } from "@/lib/leads"
import { listOnboardingForms } from "@/lib/onboarding"

export const metadata: Metadata = { title: "Lead" }
export const dynamic = "force-dynamic"

// One person, in the Contacts idiom: they are the masthead — disc, name, what
// they are, what they're worth, and two glyphs saying whether their repo and
// their Stripe customer exist — the five things you'd open this page on a
// phone to do are discs directly under it, and the record itself is two
// segments you switch between rather than one page you scroll past.
//
// The two segments are the honest split in what this screen is for:
//
//   Person — the record. Status, contact, the deal, how they came in (folded,
//            because it is read once), and the two red rows.
//   Work   — the surface. Notes, todos, the questionnaires they've been sent.
//
// Nothing here converts anyone. The four-step walkthrough, the "Finish
// conversion" row and the warning badges that nagged an active client about
// missing plumbing are gone: moving the status to Active client *is* the
// conversion, and an unlit glyph in the header is the whole of the reminder
// that a repo or a Stripe customer is still missing.

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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const loaded = await loadLead(id)
  if (!loaded) notFound()

  const { client, tasks, formLinks, formLibrary, lastWorked } = loaded
  const archived = client.archivedAt !== null

  // Which segment to open on. The client rewrites this in place as you switch,
  // so a refresh or a shared link comes back where it left off.
  const tab: LeadSegmentKey = isLeadSegmentKey(query.tab)
    ? query.tab
    : DEFAULT_LEAD_SEGMENT

  // The masthead reads the status through the one label lookup — the stored
  // strings ("not_won", "discussing") are never capitalised into the UI.
  const statusLabel = clientStatusLabel(client.status)
  // Whatever this deal leads with — its euros, or the percentage that *is* the
  // deal when there are none. The caption below the figure says which.
  const figure = dealFigure(client)

  return (
    <AppProfileScreen
      name={client.name}
      // Who they are, in one quiet line: the company they're from and where
      // they stand. The status is also the first row of the Person segment,
      // where it can be changed — here it is only being said.
      meta={[client.company, statusLabel].filter(Boolean).join(" · ")}
      // The figure that qualifies the whole record, in mono beside the name.
      // Captioned, so it needs no word of its own: "12%" under "Equity".
      figure={figure?.value}
      figureLabel={figure?.label}
      badges={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {/* Repo and Stripe as two status lights: lit and tappable through to
              GitHub or Stripe, or dim and tappable into the control that links
              one. The whole of what used to be a Delivery & billing section. */}
          <LeadLinks
            id={client.id}
            name={client.name}
            githubRepo={client.githubRepo}
            githubDefaultBranch={client.githubDefaultBranch}
            githubConfigured={isGithubConfigured()}
            suggestedRepoName={clientSlug(client.name)}
            stripeCustomerId={client.stripeCustomerId}
          />
          {archived ? <Badge variant="outline">Archived</Badge> : null}
          {/* The same badges the leads list carries, so what kind of deal
              this is is answered before you scroll — minus whichever term
              the figure above has already said. */}
          <DealBadges client={client} omit={figure?.kind} />
        </div>
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
      <LeadSegments
        initial={tab}
        person={
          // One column from phone to laptop. The two-column desktop layout the
          // nine-section page needed went with the sections: half of them are
          // on the other segment now, and neither side is long enough to want
          // splitting.
          <GroupedList>
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

            {/* Provenance, read once and then never — one folded row at the
                foot of the record rather than a section of its own. */}
            <LeadIntake client={client} />

            {/* Rare and irreversible — last on the segment, in red, and nowhere
                near the thumb reaching for the status at the top. */}
            <GroupedSection
              header="Danger zone"
              footer="Archiving takes them off the list and keeps the record. Deleting can't be undone."
            >
              <ClientActions
                id={client.id}
                archived={archived}
                grouped
                redirectOnDelete
              />
            </GroupedSection>
          </GroupedList>
        }
        work={
          <GroupedList>
            <LeadNotesCard id={client.id} notes={client.notes} />

            <LeadTodos
              clientId={client.id}
              clientName={client.name}
              tasks={tasks}
            />

            <FormLinks
              clientId={client.id}
              clientName={client.name}
              clientEmail={client.email}
              clientRepo={client.githubRepo}
              links={formLinks}
              forms={formLibrary.forms}
              formErrors={formLibrary.errors}
            />
          </GroupedList>
        }
      />
    </AppProfileScreen>
  )
}
