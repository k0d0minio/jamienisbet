import { and, asc, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm"

import { getDb } from "../client"
import type { EnrichmentPatch } from "../enrichment"
import { clients } from "../schema"
import type { Client, ClientStatus, FitTier } from "./clients"

// The enrichment pass's two reads and its two writes.
//
// Small, because everything that decides anything is pure and lives one level
// up: `enrichment.ts` fetches the page and reads the model's answer,
// `tiering.ts` turns facts into a letter, and this file only talks to the
// table. Same split as `queries/prospects.ts` beside it, for the same reason —
// the Enrich sheet and the `leads-enrich` script must not be able to disagree
// about which rows are due or what saving one means.

/**
 * The rungs an enrichment pass is *for*.
 *
 * The cold pool and the two open rungs — everybody whose website is still a
 * question. Deliberately not the ladder's other three: an active or past
 * client's site is not evidence about a relationship that already exists, and
 * re-grading a `not_won` row would put work into somebody who said no. A
 * single lead can still be enriched from their own profile on any rung; this
 * set is what a *batch* reaches for.
 */
export const enrichableStatuses: readonly ClientStatus[] = [
  "prospect",
  "nurture",
  "lead",
  "discussing",
]

export type EnrichableOptions = {
  /**
   * How long an enrichment stays fresh. A row read more recently than this is
   * skipped — the batch's whole cost is a page fetch and a model call per row,
   * and a bakery's home page does not change on a Tuesday.
   */
  staleDays?: number
  limit?: number
  /** Re-read everything in scope, however recently it was looked at. */
  all?: boolean
  now?: Date
}

/** A month. Long enough that a weekly run costs almost nothing, short enough
 *  that a site rebuilt in the spring is noticed before the summer. */
export const ENRICH_STALE_DAYS = 30

/**
 * Which rows a batch would read, best-first.
 *
 * "Best-first" is the fit tier, untiered last — so a run cut short by `--limit`
 * has spent its budget on the leads that matter, and the untiered rows (which
 * is what most of a fresh import is) come after the ones already known to be
 * worth calling. Ties fall back to oldest-enriched, so a second run continues
 * where the first stopped rather than starting again at the top.
 *
 * A row with no `website_url` is never here. There is nothing to fetch, and
 * the import already grades those `none` or `social_only` — a model asked to
 * read a page that does not exist is a model asked to invent one.
 */
export async function listEnrichable(
  opts: EnrichableOptions = {}
): Promise<Client[]> {
  const now = opts.now ?? new Date()
  const staleDays = opts.staleDays ?? ENRICH_STALE_DAYS
  const staleBefore = new Date(now.getTime() - staleDays * 86_400_000)

  const query = getDb()
    .select()
    .from(clients)
    .where(
      and(
        isNull(clients.archivedAt),
        inArray(clients.status, [...enrichableStatuses]),
        isNotNull(clients.websiteUrl),
        ne(clients.websiteUrl, ""),
        opts.all
          ? undefined
          : or(isNull(clients.enrichedAt), lt(clients.enrichedAt, staleBefore))
      )
    )
    .orderBy(
      // Untiered last, the same way the outreach queue sorts: `fit_tier` is
      // null on a fresh import, and a run that spent its limit on the ungraded
      // rows would never reach the A-tier ones.
      sql`${clients.fitTier} asc nulls last`,
      // Never-enriched first, then longest ago — so a second run continues
      // where a `--limit` stopped the first rather than starting again.
      sql`${clients.enrichedAt} asc nulls first`,
      asc(clients.createdAt)
    )

  return opts.limit ? query.limit(opts.limit) : query
}

/**
 * Every row a re-tier would look at — the same rungs, with or without a
 * website.
 *
 * A separate read because a re-tier is a different operation: it reads no page,
 * spends nothing at the Gateway and touches nothing but `fit_tier`, so it has
 * no business filtering on a website or on when anybody last looked. A lead
 * whose grade was typed in by hand deserves the same letter as one the model
 * graded.
 */
export async function listTierable(): Promise<Client[]> {
  return getDb()
    .select()
    .from(clients)
    .where(
      and(
        isNull(clients.archivedAt),
        inArray(clients.status, [...enrichableStatuses])
      )
    )
    .orderBy(asc(clients.name))
}

/**
 * Write what was accepted, and record that the site was read.
 *
 * Its own write rather than `updateClient` for one reason, and it is the
 * important one: **it does not stamp `last_touched_at`.** Reading a stranger's
 * home page is not contact. Routing this through the profile's own update
 * would move every enriched lead to the bottom of the staleness sort — eighty
 * rows looking freshly worked the morning after a batch that spoke to nobody.
 *
 * `enriched_at` is stamped even when the patch is empty, which is the point of
 * the column: "I read it and there was nothing to change" is what stops the
 * batch reading the same page again next week.
 */
export async function saveEnrichment(
  id: string,
  patch: EnrichmentPatch,
  at: Date = new Date()
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ ...patch, enrichedAt: at })
    .where(eq(clients.id, id))
    .returning()
  return row
}

/**
 * Set the derived tier, and nothing else at all.
 *
 * No `enriched_at` either: a re-tier read no page, and stamping it as an
 * enrichment would make the batch skip a row whose website has never actually
 * been looked at. Deriving a letter from facts already on file is arithmetic,
 * and arithmetic leaves no trace.
 */
export async function setFitTier(
  id: string,
  tier: FitTier | null
): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({ fitTier: tier })
    .where(eq(clients.id, id))
    .returning()
  return row
}
