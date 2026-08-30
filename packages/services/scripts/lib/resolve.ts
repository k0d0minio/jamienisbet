import {
  clientStatusLabel,
  getClient,
  searchClients,
  type Client,
} from "@jamie-nisbet/services"

import { UsageError } from "./args"
import { day, table } from "./out"

// Turning what the operator has in their hand into one row.
//
// Nobody working a list from a terminal is holding a uuid. They are holding a
// business name, half of one, a phone number, or the eight characters the
// queue printed twenty minutes ago — so all of those work, and the one thing
// that never happens is the script picking a winner out of several. An
// ambiguous match prints the candidates and stops: logging a call against the
// wrong lead is a mistake nothing later notices.

/**
 * The single lead `term` names, or a `UsageError` explaining why there isn't
 * one.
 *
 * A full uuid is looked up directly — that is what a script quoting another
 * script's output passes, and it should not go through a `like`.
 */
export async function resolveClient(term: string): Promise<Client> {
  const needle = term.trim()
  if (needle === "") throw new UsageError("no lead given")

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(needle)) {
    const exact = await getClient(needle)
    if (!exact) throw new UsageError(`no lead with id ${needle}`)
    return exact
  }

  const matches = await searchClients(needle, { limit: 12 })
  if (matches.length === 1) return matches[0]

  if (matches.length === 0) {
    throw new UsageError(
      `nothing matches "${needle}" — try a shorter fragment, an email, or a phone number`
    )
  }

  // An exact name is not an ambiguity, however many rows contain it as a
  // substring: "Sol" matching "Sol" and "Padaria Sol" means the first one.
  const exactly = matches.filter(
    (row) => row.name.trim().toLowerCase() === needle.toLowerCase()
  )
  if (exactly.length === 1) return exactly[0]

  printCandidates(matches)
  throw new UsageError(
    `"${needle}" matches ${matches.length} leads — narrow it, or pass an id from the list above`
  )
}

function printCandidates(matches: readonly Client[]): void {
  table(
    matches.map((row) => [
      shortId(row.id),
      row.name,
      row.town ?? "—",
      clientStatusLabel(row.status),
      day(row.lastTouchedAt ?? row.createdAt),
    ]),
    { head: ["id", "name", "town", "status", "last worked"] }
  )
}

/** The first eight characters of a uuid — enough to be unique in a table this
 *  size, and short enough to retype. Every script prints this, and
 *  `resolveClient` takes it back. */
export function shortId(id: string): string {
  return id.slice(0, 8)
}
