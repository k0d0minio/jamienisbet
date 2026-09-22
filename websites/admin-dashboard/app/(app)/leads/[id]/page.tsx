import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Badge, GroupedList, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"
import {
  clientStatusLabel,
  contactPointsOf,
  deriveFitTier,
  draftChannelOf,
  draftKindFor,
  getClient,
  listFormLinksForClient,
  listOpenTasksForClient,
  listTouchesForClient,
  nextActionStatuses,
  normalizeSuppressionValue,
  suggestNextTouch,
  suppressionKindLabel,
  suppressionsForClient,
  type SuppressionKind,
} from "@jamie-nisbet/services"

import { AppProfileScreen } from "@/components/app-screen"
import { ClientActions } from "@/components/client-actions"
import { ViewTransitionLink } from "@/components/view-transition-link"
import { DealBadges } from "@/components/deal-badges"
import { FormLinks } from "@/components/form-links"
import { LeadActionRow } from "@/components/lead-action-row"
import { LeadContactCard } from "@/components/lead-contact-card"
import { LeadDealCard, type AgreementSuggestion } from "@/components/lead-deal-card"
import { LeadDealFolder } from "@/components/lead-deal-folder"
import { LeadDraft } from "@/components/lead-draft"
import { LeadFactsCard } from "@/components/lead-facts-card"
import { LeadIntake } from "@/components/lead-intake"
import { LeadLinks } from "@/components/lead-links"
import { LeadNextAction } from "@/components/lead-next-action"
import { LeadNotesCard } from "@/components/lead-notes-card"
import { LeadReply } from "@/components/lead-reply"
import { LeadSegments } from "@/components/lead-segments"
import { LeadStatusRow } from "@/components/lead-status-row"
import { LeadSuppress } from "@/components/lead-suppress"
import { LeadTodos } from "@/components/lead-todos"
import { LeadTouches } from "@/components/lead-touches"
import { TouchRow } from "@/components/touch-row"
import { isGatewayConfigured } from "@/lib/ai"
import {
  daysSince,
  formatDate,
  formatShortDay,
  waitingLabel,
} from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"
import {
  DEFAULT_LEAD_SEGMENT,
  isLeadSegmentKey,
  type LeadSegmentKey,
} from "@/lib/lead-segments"
import { dealBadge, readDealFolder } from "@/lib/deals"
import { dealFigure } from "@/lib/leads"
import { listOnboardingForms } from "@/lib/onboarding"
import type { SuppressedChannels } from "@/lib/suppression"

export const metadata: Metadata = { title: "Lead" }
// No `dynamic = "force-dynamic"` (2026-09-22): the page is request-time anyway
// (it awaits `params` and reads Neon through drizzle, not fetch), and the
// export would set `fetchCache: "force-no-store"` across the segment — which
// strips the 60-second cache off every GitHub read in `lib/deals.ts` and
// `lib/onboarding.ts` and re-reads icm-board on every render. `lib/tickets.ts`'s
// header says how that once 403'd the board.

// How much history the profile reads. A prospect that ran a full cadence has
// five or six touches; a client three years in could have hundreds, and none
// of the old ones is what you came to the page for. The section says when the
// list is the cap rather than the whole story.
const TOUCH_HISTORY_LIMIT = 25

// One person, in the Contacts idiom: they are the masthead — disc, name, what
// they are, what they're worth, and two glyphs saying whether their repo and
// their Stripe customer exist — the five things you'd open this page on a
// phone to do are discs directly under it, and the record itself is two
// segments you switch between rather than one page you scroll past.
//
// The two segments are the honest split in what this screen is for:
//
//   Person — the record. Status, contact, what they *are*, the deal, how they
//            came in (folded, because it is read once), and the two red rows.
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
  const [rawTasks, rawTouches, formLinks, formLibrary, optOuts, dealFolder] =
    await Promise.all([
      listOpenTasksForClient(client.id),
      listTouchesForClient(client.id, TOUCH_HISTORY_LIMIT),
      listFormLinksForClient(client.id),
      listOnboardingForms(client.githubRepo),
      // Who on this record has asked not to be contacted. One read for all
      // four channels, because every handoff on this page — the action discs,
      // the contact rows — has to know before it draws itself.
      suppressionsForClient(client),
      // The deal folder in icm-board, when the row names one — the words
      // beside the state (D24). Null when there is no slug or no token.
      readDealFolder(client.dealSlug),
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

  // Dates are formatted here, on the server, for the same reason `lastWorked`
  // is: the history is handed to a client section as children, and nothing
  // downstream should be reading a clock during a render.
  const touches = rawTouches.map((t) => ({
    id: t.id,
    channel: t.channel,
    direction: t.direction,
    outcome: t.outcome,
    note: t.note,
    draftMd: t.draftMd,
    model: t.model,
    loggedOn: formatShortDay(t.loggedAt),
  }))

  // The opt-outs, resolved here rather than in the browser: the normalization
  // that decides whether two spellings of a number are the same number lives
  // in the services layer, and no client component pulls that in.
  const closed = new Set(optOuts.map((row) => `${row.kind}:${row.value}`))
  const isClosed = (kind: SuppressionKind, raw: string | null): boolean => {
    const value = normalizeSuppressionValue(kind, raw)
    return value !== null && closed.has(`${kind}:${value}`)
  }
  const chat = client.whatsapp ?? client.phone
  const suppressed: SuppressedChannels = {
    email: isClosed("email", client.email),
    phone: isClosed("phone", client.phone),
    whatsapp: isClosed("phone", chat),
    instagram: isClosed("instagram", client.instagram),
  }

  // Every channel this record has, and what the opt-out section says about
  // each: the values are the normalized ones, so what the sheet promises to
  // close is literally what would land in the table.
  const optOutByKey = new Map(
    optOuts.map((row) => [`${row.kind}:${row.value}`, row] as const)
  )
  const channels = contactPointsOf(client).map((point) => {
    const hit = optOutByKey.get(`${point.kind}:${point.value}`)
    return {
      kind: point.kind,
      label: suppressionKindLabel(point.kind),
      value: point.value,
      closed: hit
        ? { on: formatShortDay(hit.createdAt), reason: hit.reason }
        : null,
    }
  })

  // Where the cadence thinks this lead is, read as a message rather than as a
  // next action: which of the four rungs the draft panel should open on, and
  // down which door. Pure — `suggestNextTouch` reads the history it was handed
  // and nothing else — so it costs the profile no extra round trip.
  //
  // The channel is only a default and only sometimes a writable one: a cadence
  // that says "walk in" is saying something true that is not a message, and the
  // panel falls back to whichever door is actually open.
  const cadence = suggestNextTouch(client, rawTouches, new Date(now))
  const draft = {
    kind: draftKindFor(cadence),
    channel: draftChannelOf(cadence?.channel),
  }

  // Where a reply most likely came in: the door the last touch used. Only a
  // default, and the picker is right there — but on the common case the answer
  // to "where did this arrive" is "the same place I wrote to them", which is a
  // tap saved on every reply.
  const replyChannel = rawTouches[0]?.channel ?? cadence?.channel ?? "whatsapp"

  // What the four stored facts *derive* as, by the one function that owns the
  // weights. Pure and cheap — four columns and no round trip — and it answers
  // the question the stored letter cannot: whether the facts have moved on
  // since somebody graded them. The facts card says so; nothing acts on it.
  const derivedTier = deriveFitTier(client).tier

  // What happens next, as the masthead reads it. A parked lead's line is its
  // wake date instead — the one rung where nothing is planned on purpose.
  const parked = client.status === "nurture"
  const nextDate = parked ? client.wakeAt : client.nextActionDue

  // The agreement's figures, offered on the Deal card when the folder has
  // paper and the row says something else — a prefill Jamie saves, never a
  // sync (D24). Silent when they already agree, or there is no agreement.
  const agreement = dealFolder?.agreement ?? null
  const suggestion: AgreementSuggestion | null =
    agreement &&
    agreement.agreedMinor !== null &&
    (agreement.agreedMinor !== client.valueMinor ||
      (agreement.recurringMinor ?? 0) !== client.supportMinor)
      ? {
          agreedMinor: agreement.agreedMinor,
          recurringMinor: agreement.recurringMinor,
          source: `05-agreement.md in ${dealFolder?.engagement ?? "the deal folder"}`,
        }
      : null

  return {
    client,
    tasks,
    touches,
    formLinks,
    formLibrary,
    suppressed,
    channels,
    dealFolder,
    suggestion,
    draft,
    replyChannel,
    derivedTier,
    // When the site was last read, formatted on the server like every other
    // date this page hands to a client component.
    enrichedOn: client.enrichedAt ? formatShortDay(client.enrichedAt) : null,
    lastWorked: waitingLabel(
      daysSince(client.lastTouchedAt ?? client.createdAt, now)
    ),
    next: {
      parked,
      action: client.nextAction,
      dueLabel: nextDate ? formatShortDay(nextDate) : null,
      dueValue: nextDate ? nextDate.toISOString().slice(0, 10) : null,
      overdue: nextDate !== null && nextDate.getTime() < now,
      // A next step is only worth prompting for on the rungs something is
      // supposed to happen next on — plus `nurture`, whose wake date is the
      // same question asked the other way round.
      expected:
        parked ||
        (nextActionStatuses as readonly string[]).includes(client.status),
    },
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

  const {
    client,
    tasks,
    touches,
    formLinks,
    formLibrary,
    suppressed,
    channels,
    dealFolder,
    suggestion,
    draft,
    replyChannel,
    derivedTier,
    enrichedOn,
    lastWorked,
    next,
  } = loaded
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
          {/* What happens next, on its own line above the terms — the one
              thing on this page that is about *doing* rather than about who
              they are, and the reason the profile is worth opening. Silent on
              a rung where nothing is planned by design. */}
          <LeadNextAction
            id={client.id}
            action={next.action}
            dueLabel={next.dueLabel}
            dueValue={next.dueValue}
            overdue={next.overdue}
            parked={next.parked}
            expected={next.expected}
          />
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
          whatsapp={client.whatsapp}
          email={client.email}
          lastWorked={lastWorked}
          workStartedOn={
            client.workStartedAt ? formatDate(client.workStartedAt) : null
          }
          suppressed={suppressed}
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
                whatsapp: client.whatsapp,
                instagram: client.instagram,
              }}
              suppressed={suppressed}
            />

            {/* What they *are*, as opposed to how you reach them — the block
                the cold pool needed. Rendered for everyone: an inbound lead
                starts with none of it and says so, and a sector and a town are
                worth knowing about a client too. */}
            <LeadFactsCard
              client={{
                id: client.id,
                sector: client.sector,
                town: client.town,
                language: client.language,
                hook: client.hook,
                fitTier: client.fitTier,
                websiteUrl: client.websiteUrl,
                websiteGrade: client.websiteGrade,
                reviewCount: client.reviewCount,
              }}
              derivedTier={derivedTier}
              enrichConfigured={isGatewayConfigured()}
              enrichedOn={enrichedOn}
            />

            <LeadDealCard
              client={{
                id: client.id,
                name: client.name,
                dealSlug: client.dealSlug,
                valueMinor: client.valueMinor,
                billingType: client.billingType,
                dealType: client.dealType,
                barterTerms: client.barterTerms,
                commissionBps: client.commissionBps,
                equityBps: client.equityBps,
                supportMinor: client.supportMinor,
              }}
              // The folder name follows the repo name's rule, with hyphens:
              // `clientSlug` gives snake_case for GitHub, deal folders are
              // kebab-case (workspaces/deals/README.md).
              proposedSlug={clientSlug(client.name).replace(/_/g, "-")}
              suggestion={suggestion}
            />

            {/* The words beside the state: what the deal folder in icm-board
                says, read live, with the badge when it and the rung cannot
                both be true (D24). Only when the row names a folder. */}
            {dealFolder ? (
              <LeadDealFolder
                folder={dealFolder}
                badge={dealBadge(client.status, dealFolder)}
              />
            ) : null}

            {/* Provenance, read once and then never — one folded row at the
                foot of the record rather than a section of its own. */}
            <LeadIntake client={client} />

            {/* The opt-out: irreversible in a different way from the two rows
                below it, and about a person rather than about a record — so it
                gets a section of its own rather than a third red row under a
                footer that would be describing something else. */}
            <LeadSuppress
              clientId={client.id}
              clientName={client.name}
              channels={channels}
            />

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
            {/* The memory of contact, first on the segment: what has already
                been tried is what decides what to try next, so it reads above
                the notes rather than under the forms. The rows are rendered
                here, on the server — a draft is markdown, and the section
                itself is a client component. */}
            <LeadTouches
              clientId={client.id}
              clientName={client.name}
              count={touches.length}
              capped={touches.length === TOUCH_HISTORY_LIMIT}
              // The other half of the memory of contact: what came back. Paste
              // it, and the outcome, the rung, the next step and the answer are
              // proposed one tap at a time — none of them applied until tapped,
              // and the paste logged as an inbound touch whatever is done with
              // them.
              reply={
                <LeadReply
                  clientId={client.id}
                  clientName={client.name}
                  email={client.email}
                  phone={client.phone}
                  whatsapp={client.whatsapp}
                  instagram={client.instagram}
                  configured={isGatewayConfigured()}
                  defaultChannel={replyChannel}
                />
              }
            >
              {touches.map((touch) => (
                <TouchRow key={touch.id} touch={touch} />
              ))}
            </LeadTouches>

            {/* What to say, and the doors it can go out of — directly under
                the history it is grounded on, because the last thing that
                happened is what decides the next message. Nothing here sends:
                the panel hands the draft to a mail app, to WhatsApp or to the
                clipboard, and offers to log the touch on the way past. */}
            <LeadDraft
              clientId={client.id}
              clientName={client.name}
              email={client.email}
              phone={client.phone}
              whatsapp={client.whatsapp}
              instagram={client.instagram}
              suppressed={suppressed}
              configured={isGatewayConfigured()}
              defaultKind={draft.kind}
              defaultChannel={draft.channel}
              hasHook={Boolean(client.hook)}
              portuguese={client.language === "pt"}
            />

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
              dealSlug={client.dealSlug}
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
