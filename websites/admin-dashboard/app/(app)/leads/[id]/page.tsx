import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TriangleAlert } from "lucide-react"

import {
  contactPointsOf,
  deriveFitTier,
  draftChannelOf,
  draftKindFor,
  getClient,
  listFormLinksForClient,
  listTouchesForClient,
  nextActionStatuses,
  normalizeSuppressionValue,
  suggestNextTouch,
  suppressionKindLabel,
  suppressionsForClient,
  type SuppressionKind,
} from "@jamie-nisbet/services"

import { DealBadges } from "@/components/deal-badges"
import { FormLinks } from "@/components/form-links"
import { LeadActionRow } from "@/components/lead-action-row"
import { LeadContactCard } from "@/components/lead-contact-card"
import { LeadDealCard, type AgreementSuggestion } from "@/components/lead-deal-card"
import { LeadDealFolder } from "@/components/lead-deal-folder"
import { LeadDraft } from "@/components/lead-draft"
import { LeadFactsCard } from "@/components/lead-facts-card"
import { LeadIntake, sourceLabel } from "@/components/lead-intake"
import { LeadLinks } from "@/components/lead-links"
import { LeadNextAction } from "@/components/lead-next-action"
import { LeadNotesCard } from "@/components/lead-notes-card"
import { LeadProfile } from "@/components/lead-profile"
import { LeadReply } from "@/components/lead-reply"
import { LeadStatusMenu } from "@/components/lead-status-menu"
import {
  LeadOptOutSheet,
  LeadOptOuts,
  hasReachableChannel,
} from "@/components/lead-suppress"
import { LeadTouches } from "@/components/lead-touches"
import { CameInRow, TouchRow } from "@/components/touch-row"
import { isGatewayConfigured } from "@/lib/ai"
import {
  daysSince,
  formatDate,
  formatShortDay,
  waitingLabel,
} from "@/lib/format"
import { clientSlug, isGithubConfigured } from "@/lib/github"
import { leadTabFrom } from "@/lib/lead-tabs"
import { dealBadge, dealFolderSlug, readDealFolder } from "@/lib/deals"
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

// One person, on the desk tier (D-20): the head — who they are, what they are
// worth, and a bar of everything you open the page to do — then, at the desk,
// the record on the left and what has happened on the right, side by side
// rather than behind two segments. `components/lead-profile.tsx` is the frame;
// everything in it is built here, on the server.
//
// Nothing here converts anyone. Moving the status to Active client *is* the
// conversion, and an unlit repo or Stripe light in the head is the whole of
// the reminder that one is still missing.

/** How late a next step is, for the block's eyebrow: "2 days late". A date
 *  that passed earlier today is simply late. */
function lateLabel(days: number): string {
  if (days <= 0) return "late"
  return days === 1 ? "1 day late" : `${days} days late`
}

/** Two letters for the monogram: the first of the first two words. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
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
  const [rawTouches, formLinks, formLibrary, optOuts, dealFolder] =
    await Promise.all([
      listTouchesForClient(client.id, TOUCH_HISTORY_LIMIT),
      listFormLinksForClient(client.id),
      listOnboardingForms(client.githubRepo),
      // Who on this record has asked not to be contacted. One read for all
      // four channels, because every handoff on this page — the action discs,
      // the contact rows — has to know before it draws itself.
      suppressionsForClient(client),
      // The deal folder in icm-board — the words beside the state (D24). It is
      // named after the delivery repo (D28), so null until a repo is connected,
      // or when there is no token.
      readDealFolder(dealFolderSlug(client.githubRepo)),
    ])

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
    // The timeline's last line: the day the record began.
    cameInOn: formatShortDay(client.createdAt),
    lastWorked: waitingLabel(
      daysSince(client.lastTouchedAt ?? client.createdAt, now)
    ),
    next: {
      parked,
      action: client.nextAction,
      dueLabel: nextDate ? formatShortDay(nextDate) : null,
      dueValue: nextDate ? nextDate.toISOString().slice(0, 10) : null,
      overdue: nextDate !== null && nextDate.getTime() < now,
      lateLabel:
        nextDate !== null && nextDate.getTime() < now
          ? lateLabel(daysSince(nextDate, now))
          : null,
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
    cameInOn,
    lastWorked,
    next,
  } = loaded
  const archived = client.archivedAt !== null

  // Whatever this deal leads with — its euros, or the percentage that *is* the
  // deal when there are none. The caption under the figure says which.
  const figure = dealFigure(client)
  // Where the deal folder says the engagement stands, and the one line said
  // when the rung and the folder cannot both be true (D24).
  const stage = dealFolder?.error ? null : (dealFolder?.stage ?? null)
  const mismatch = dealBadge(client.status, dealFolder)
  const configured = isGatewayConfigured()

  // The head's metadata line, one fact per slot, joined by a middle dot.
  const facts: React.ReactNode[] = [
    client.company ? <span key="company">{client.company}</span> : null,
    <LeadStatusMenu key="status" id={client.id} value={client.status} />,
    stage ? (
      <span
        key="stage"
        className="font-mono text-desk-meta"
        title={`Deal folder stage: ${stage.code}-${stage.name}`}
      >
        {stage.code} {stage.name}
      </span>
    ) : null,
    client.fitTier ? (
      <span key="tier">
        tier <span className="font-mono text-desk-meta">{client.fitTier}</span>
      </span>
    ) : null,
    archived ? (
      <span key="archived" className="text-desk-fg-3">
        Archived
      </span>
    ) : null,
  ].filter(Boolean)

  const head = (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-desk-sunken font-mono text-desk-ui text-desk-fg-2"
        >
          {initialsOf(client.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-desk-title text-desk-fg">
            {client.name}
          </h1>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-desk-ui text-desk-fg-2">
            {facts.map((fact, index) => (
              <span key={index} className="inline-flex items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden className="text-desk-fg-3">
                    ·
                  </span>
                ) : null}
                {fact}
              </span>
            ))}
          </p>
          <p className="font-mono text-desk-meta text-desk-fg-3">
            {lastWorked === "today"
              ? "last worked today"
              : `last worked ${lastWorked} ago`}
          </p>
          {mismatch ? (
            <p className="flex items-start gap-1.5 text-desk-meta text-desk-fg-2">
              <TriangleAlert
                className="mt-px size-3.5 shrink-0 text-desk-running"
                aria-hidden
              />
              {mismatch}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {figure ? (
            <div className="flex flex-col items-end">
              <span className="font-mono text-desk-figure text-desk-fg tabular-nums">
                {figure.value}
              </span>
              <span className="text-desk-meta text-desk-fg-3">
                {figure.label}
              </span>
            </div>
          ) : null}
          {/* Repo and Stripe as two status lights: lit and pressable through
              to GitHub or Stripe, or dim and pressable into the control that
              links one. */}
          <LeadLinks
            id={client.id}
            name={client.name}
            githubRepo={client.githubRepo}
            githubDefaultBranch={client.githubDefaultBranch}
            githubConfigured={isGithubConfigured()}
            suggestedRepoName={clientSlug(client.name)}
            stripeCustomerId={client.stripeCustomerId}
          />
          <DealBadges
            client={client}
            omit={figure?.kind}
            className="justify-end"
          />
        </div>
      </div>
      <LeadActionRow
        id={client.id}
        phone={client.phone}
        whatsapp={client.whatsapp}
        email={client.email}
        lastWorked={lastWorked}
        workStartedOn={
          client.workStartedAt ? formatDate(client.workStartedAt) : null
        }
        archived={archived}
        canOptOut={hasReachableChannel(channels)}
        suppressed={suppressed}
      />
      {/* Opened from the bar's menu; mounted here so it is on every layout. */}
      <LeadOptOutSheet
        clientId={client.id}
        clientName={client.name}
        channels={channels}
      />
    </div>
  )

  const record = (
    <>
      {/* What happens next — first, on both layouts. Silent on a rung where
          nothing is planned by design. */}
      <LeadNextAction
        id={client.id}
        action={next.action}
        dueLabel={next.dueLabel}
        dueValue={next.dueValue}
        overdue={next.overdue}
        lateLabel={next.lateLabel}
        parked={next.parked}
        expected={next.expected}
      />

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

      {/* What they *are*, as opposed to how you reach them. Rendered for
          everyone: an inbound lead starts with none of it and says so. */}
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
        enrichConfigured={configured}
        enrichedOn={enrichedOn}
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
          supportMinor: client.supportMinor,
        }}
        // The folder is named after the repo (D28) — nothing to propose or
        // set; the card only says which folder that is.
        dealFolder={dealFolderSlug(client.githubRepo)}
        suggestion={suggestion}
      />

      {/* The words beside the state: what the deal folder in icm-board says,
          read live (D24). Only once the row has a repo (D28). */}
      {dealFolder ? <LeadDealFolder folder={dealFolder} /> : null}

      {/* The channels that asked not to be contacted, and when. */}
      <LeadOptOuts channels={channels} />

      {/* Provenance, read once and then never — folded, last. */}
      <LeadIntake client={client} />
    </>
  )

  const panels = {
    activity: (
      // The memory of contact: what has already been tried is what decides
      // what to try next. The rows are rendered here, on the server — a draft
      // is markdown, and the section itself is a client component.
      <LeadTouches
        clientId={client.id}
        clientName={client.name}
        count={touches.length}
        capped={touches.length === TOUCH_HISTORY_LIMIT}
        // The other half of the memory of contact: what came back. Paste it,
        // and the outcome, the rung, the next step and the answer are
        // proposed one tap at a time — none of them applied until tapped.
        reply={
          <LeadReply
            clientId={client.id}
            clientName={client.name}
            email={client.email}
            phone={client.phone}
            whatsapp={client.whatsapp}
            instagram={client.instagram}
            configured={configured}
            defaultChannel={replyChannel}
          />
        }
        cameIn={<CameInRow on={cameInOn} source={sourceLabel(client.source)} />}
      >
        {touches.map((touch) => (
          <TouchRow key={touch.id} touch={touch} />
        ))}
      </LeadTouches>
    ),
    // What to say, and the doors it can go out of. Nothing here sends: the
    // panel hands the draft to a mail app, to WhatsApp or to the clipboard,
    // and offers to log the touch on the way past.
    draft: (
      <LeadDraft
        clientId={client.id}
        clientName={client.name}
        email={client.email}
        phone={client.phone}
        whatsapp={client.whatsapp}
        instagram={client.instagram}
        suppressed={suppressed}
        configured={configured}
        defaultKind={draft.kind}
        defaultChannel={draft.channel}
        hasHook={Boolean(client.hook)}
        portuguese={client.language === "pt"}
      />
    ),
    forms: (
      <FormLinks
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        dealFolder={dealFolderSlug(client.githubRepo)}
        links={formLinks}
        forms={formLibrary.forms}
        formErrors={formLibrary.errors}
      />
    ),
    notes: <LeadNotesCard id={client.id} notes={client.notes} />,
  }

  return (
    <LeadProfile
      // A different lead is a different profile: j / k lands on fresh state
      // (the tab, the sheets) rather than the last lead's.
      key={client.id}
      id={client.id}
      initialTab={leadTabFrom(query.tab)}
      formsCount={formLinks.length}
      head={head}
      record={record}
      panels={panels}
    />
  )
}
