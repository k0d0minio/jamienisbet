import { and, asc, eq, inArray, lt, ne, sql } from "drizzle-orm"

import { getDb } from "../client"
import { clients } from "../schema"
import type { Client, ClientStatus } from "./clients"

// The retention rule, in code — §5 of `.icm/docs/lia-cold-outreach.md`.
//
// Prospect data earns its keep by being worked. A cold row that has sat
// untouched for a year was a guess that did not pay off, and keeping it is
// keeping somebody's phone number for no reason anyone could defend. So it is
// anonymised: the business is forgotten, the *shape* of the business is kept.
//
// Two functions, and the split matters: `listPurgeable` answers "what is due",
// `anonymiseClient` does one row. The script's `--dry-run` is the first
// without the second, which is only possible because they are separate — a
// single `purgeExpired()` would have to be trusted rather than read.
//
// Nothing here runs on a timer. The purge is an operator script (LIA §5), so
// somebody chooses the day it happens and reads what it is about to do.

/** The line, in months. Jamie's own — drawn to be defensible rather than
 *  derived from a rule that names a number (LIA §5). */
export const RETENTION_MONTHS = 12

/**
 * The two rungs the rule applies to: a prospect that never engaged, and a
 * relationship that ended without one.
 *
 * `nurture` is out, and that is not an oversight — a parked row is *waiting*,
 * with a wake date that says when it comes back, so it is being worked on the
 * slowest possible schedule rather than not at all. Everything from
 * `discussing` up leaves this assessment entirely: those are business
 * relationships with their own basis and their own accounting retention.
 */
export const retentionStatuses: readonly ClientStatus[] = ["prospect", "not_won"]

/**
 * What the name column says once the business behind it has been forgotten.
 *
 * The column is `not null`, so anonymising cannot mean "empty" — it means a
 * word that reads, on a screen, as *deliberately gone* rather than as a row
 * somebody failed to fill in. It is also how the purge knows not to count the
 * same row again next year.
 */
export const REDACTED_NAME = "[redacted — retention]"

/**
 * Rows that are due to be forgotten: on a retention rung, and nothing has
 * happened with them for `months`.
 *
 * "Nothing has happened" is `coalesce(last_touched_at, created_at)` — the same
 * measure the leads list sorts on and the crack-finder ages against. A row
 * that was imported and never worked ages from the day it was imported, which
 * is the case this rule exists for.
 *
 * **Archived rows are included.** Archiving hides a row; it does not stop it
 * holding somebody's phone number, and a retention rule that skipped the
 * archive would keep exactly the data nobody is looking at any more.
 *
 * Already-anonymised rows are excluded by their name, so a purge run twice in
 * a week reports nothing the second time.
 */
export async function listPurgeable(
  opts: { now?: Date; months?: number } = {}
): Promise<Client[]> {
  const now = opts.now ?? new Date()
  const months = opts.months ?? RETENTION_MONTHS
  const cutoff = new Date(now.getTime())
  cutoff.setMonth(cutoff.getMonth() - months)

  return getDb()
    .select()
    .from(clients)
    .where(
      and(
        inArray(clients.status, [...retentionStatuses]),
        ne(clients.name, REDACTED_NAME),
        lt(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`, cutoff)
      )
    )
    .orderBy(asc(sql`coalesce(${clients.lastTouchedAt}, ${clients.createdAt})`))
}

/**
 * Forget the business behind one row, keep the shape of it.
 *
 * Cleared: the name, the company, the email, the phone, the WhatsApp line, the
 * Instagram handle, the website address and the hook. Kept: the sector, the
 * town, the tier, the status and the dates — the fact that a business of that
 * shape was once approached, which is what stops the same list being compiled
 * and worked again next spring.
 *
 * `company` is cleared alongside `name` even though §5 names only the name:
 * for an imported business row the two hold the same string, so clearing one
 * and leaving the other would anonymise nothing. That is reading the rule, not
 * extending it.
 *
 * `website_url` is on §5's list for the same kind of reason. A row left reading
 * *restaurant · Ericeira · https://…* names the business as squarely as the
 * name column did, and where that business is a sole trader whose site carries
 * their own name it names a person. Nothing was lost by clearing it: what
 * survives to stop next spring's re-import is the sector, the town and the
 * dates, and a row a year cold is not worked from its website either. The
 * `website_grade` stays — a letter about a site nobody can now find is shape,
 * not identity — and clearing the URL is what drops the row out of
 * `listEnrichable`, which is the right answer for a business that has been
 * forgotten.
 *
 * What is **not** cleared: `notes` and `intake_message`. They are Jamie's own
 * words about a prospect and a form-filler's about themselves, so whether
 * either names a person is a question about what was written — flagged by the
 * purge script's output for a human to read, never decided by it.
 *
 * `last_touched_at` is deliberately left alone. Every other write in this
 * layer stamps it, because every other write is somebody working the
 * relationship — this one is the opposite, and a purged row that came back
 * looking freshly touched would be immune to the rule that just ran on it.
 *
 * Any suppression against these contact points stays standing (LIA §4): it
 * lives in its own table with no key back to here, which is exactly why this
 * function can clear the row without un-stopping anything.
 */
export async function anonymiseClient(id: string): Promise<Client | undefined> {
  const [row] = await getDb()
    .update(clients)
    .set({
      name: REDACTED_NAME,
      company: null,
      email: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      websiteUrl: null,
      hook: null,
    })
    .where(eq(clients.id, id))
    .returning()
  return row
}
