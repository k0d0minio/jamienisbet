import { asc } from "drizzle-orm"

import { getDb } from "../client"
import type { ProspectDraft } from "../import"
import { clients } from "../schema"
import type { Client, ClientStatus } from "./clients"

// The write side of the import, and the read it needs to be safe.
//
// Two functions, because an import is two questions: *what is already here*
// (so a business is never written twice) and *put these in*. Everything else
// about an import — reading a file, mapping its headers, normalizing a cell,
// checking a suppression — is either the pure `../import` module or the
// operator script that drives it. This file only talks to the table.

/** The projection a dedupe check needs, and nothing more: enough to build a
 *  key, and enough for the report to say what the existing row is. Deliberately
 *  not `Client` — the check runs against every row in the table, and pulling
 *  eighty columns to compare two is a waste of a round trip. */
export type ProspectKey = {
  id: string
  name: string
  town: string | null
  status: string
  archivedAt: Date | null
}

/**
 * Every row in the table, as a dedupe key's worth of columns.
 *
 * **Archived rows included, deliberately.** A prospect that was imported in
 * March, worked, and archived is still that business — importing them again
 * because the archive is out of sight is exactly the mistake this read exists
 * to prevent. The report says which state the existing row is in, and the
 * operator decides.
 *
 * The whole table, because the answer has to be exhaustive to be worth
 * anything: a dedupe that only looked at prospects would happily re-import a
 * business that is now a paying client. At a few hundred rows this is one
 * small query; if the table ever grows past what a script should hold in
 * memory, that is the day this gains a key column and an index, not the day
 * the script starts guessing.
 */
export async function listProspectKeys(): Promise<ProspectKey[]> {
  return getDb()
    .select({
      id: clients.id,
      name: clients.name,
      town: clients.town,
      status: clients.status,
      archivedAt: clients.archivedAt,
    })
    .from(clients)
    .orderBy(asc(clients.name))
}

/** Where a batch came from, in words — "2026-07-23 Mafra/Lisbon prospect
 *  list". Stamped on every row so the first message out can say where the data
 *  came from, which is what the LIA (`.icm/docs/lia-cold-outreach.md`) commits
 *  to. Required rather than optional for that reason. */
export type ImportProvenance = { sourceDetail: string }

/** How many rows go into one INSERT. The Neon HTTP driver sends a statement
 *  per round trip, so a batch of 85 is one trip rather than 85 — but a single
 *  statement carrying thousands of rows is a statement nobody can read in a
 *  log, so it is chunked. */
const CHUNK = 100

/**
 * Write a batch of prospects.
 *
 * Three columns are stamped here rather than taken from the caller, and that
 * is the point of the function: an imported row is `prospect` (not the table's
 * default `lead`), from `import`, carrying the batch it came in. A script that
 * could choose those could file the cold pool as open leads, which would put
 * eighty strangers on top of the staleness nag the morning after the import.
 *
 * `last_touched_at` is left null on purpose and is not settable: nothing has
 * happened with this relationship yet. Stamping the import itself as a touch
 * would be a lie the whole engine then reads — the leads list sorts on it, the
 * cadence measures from it, and "we contacted them the day we typed them in"
 * is not what happened.
 *
 * Returns the rows as written, in the order given.
 */
export async function insertProspects(
  drafts: readonly ProspectDraft[],
  provenance: ImportProvenance
): Promise<Client[]> {
  if (drafts.length === 0) return []

  const status: ClientStatus = "prospect"
  const rows: Client[] = []

  for (let at = 0; at < drafts.length; at += CHUNK) {
    const chunk = drafts.slice(at, at + CHUNK)
    const written = await getDb()
      .insert(clients)
      .values(
        chunk.map((draft) => ({
          ...draft,
          status,
          source: "import",
          sourceDetail: provenance.sourceDetail.trim().slice(0, 200),
        }))
      )
      .returning()
    rows.push(...written)
  }

  return rows
}
