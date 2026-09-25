"use server"

import { clientStatusLabel, listClients } from "@jamie-nisbet/services"

import { launchLinkProps, primaryLaunch, type Launch } from "@/lib/launchers"
import { readBoard, type BoardTicket, type TicketGroup } from "@/lib/tickets"

// What the command palette searches — read when it opens, never before.
//
// One read path, not a new one: the board comes from the same `readBoard()`
// Work renders from, so every GitHub read behind it is served from the board's
// own 60-second cache and tags (lib/tickets.ts) — opening the palette on Work
// costs nothing the screen didn't already pay, and elsewhere it costs what
// opening Work would. The leads are the same `listClients` read the Leads
// screen makes. What crosses to the browser is the slim index below: labels,
// metadata and where each row goes — never a ticket body.
//
// Access is gated by proxy.ts like every action in this app: an action is a
// POST to the page it was called from, and the proxy guards every page.

export type PaletteGroup = "repos" | "tickets" | "leads" | "actions"

/** The desk tier's status marks, as the palette's ticket rows use them. */
export type PaletteStatus = "next" | "open" | "running" | "blocked" | "done"

export type PaletteEntry = {
  /** Unique across the index — also the option's DOM id. */
  id: string
  group: PaletteGroup
  label: string
  /** Trailing mono metadata; searched as well as shown. */
  meta: string | null
  /** An in-app destination. */
  href?: string
  /** A launch link — a session a human starts; opened, never fetched. */
  launch?: { url: string; newTab: boolean }
  /** Ticket rows only. */
  status?: PaletteStatus
  statusLabel?: string
}

export type PaletteIndex = {
  entries: PaletteEntry[]
  /** One line per source that could not be read. */
  notes: string[]
}

// A ticket's board group, as a dot. Today is the pick-up list — runnable now —
// so it reads as "next"; queued is the part of an epic that isn't up yet.
const STATUS: Record<TicketGroup, PaletteStatus> = {
  today: "next",
  "in-flight": "running",
  blocked: "blocked",
  next: "next",
  queued: "open",
}

const STATUS_LABEL: Record<TicketGroup, string> = {
  today: "Today",
  "in-flight": "Running",
  blocked: "Blocked",
  next: "Next",
  queued: "Open",
}

/** The board's own rule (launchLinkProps): a web target gets a new tab; a
 *  custom scheme is handed to the OS in place, where a tab would stay blank. */
function opensNewTab(launch: Launch): boolean {
  return launchLinkProps(launch).target === "_blank"
}

function boardQuery(key: "r" | "t", value: string): string {
  return `/?${new URLSearchParams({ [key]: value })}`
}

async function boardEntries(): Promise<{ entries: PaletteEntry[]; note: string | null }> {
  let board: Awaited<ReturnType<typeof readBoard>>
  try {
    board = await readBoard()
  } catch (err) {
    const detail = err instanceof Error ? err.message : "no answer"
    return { entries: [], note: `GitHub didn't answer — ${detail}` }
  }
  if (!board) return { entries: [], note: "GitHub isn't configured here" }

  const repos: PaletteEntry[] = []
  const tickets: PaletteEntry[] = []
  const launches: PaletteEntry[] = []

  for (const section of board.sections) {
    const repo = section.repo.slug
    repos.push({
      id: `repo:${section.repo.fullName}`,
      group: "repos",
      label: repo,
      meta: `${section.open} open`,
      href: boardQuery("r", repo),
    })

    for (const batch of section.batches) {
      // The runs pseudo-batch's slug is a reserved token, not a name.
      const where = batch.kind === "runs" ? "in flight" : batch.slug
      for (const ticket of batch.tickets) {
        tickets.push(ticketEntry(ticket, where))
      }

      // "Launch next" is an epic's: its next stub's own default launch — the
      // same link the batch's Copy next menu builds.
      if (batch.kind !== "epic" || !batch.next) continue
      const next = batch.tickets.find((t) => t.id === batch.next?.id)
      const primary = next ? primaryLaunch(next.launches) : null
      if (!primary?.url) continue
      launches.push({
        id: `launch:${section.repo.fullName}/${batch.slug}`,
        group: "actions",
        label: `Launch next for ${repo}`,
        meta: batch.slug,
        launch: { url: primary.url, newTab: opensNewTab(primary) },
      })
    }
  }

  const estate = primaryLaunch(board.estateCheck.launches)
  const actions: PaletteEntry[] = estate?.url
    ? [
        {
          id: "action:estate-check",
          group: "actions",
          label: "Estate check",
          meta: null,
          launch: { url: estate.url, newTab: opensNewTab(estate) },
        },
      ]
    : []

  const unreadable = board.errors.map((e) => e.repo.slug)
  const note = board.rosterError
    ? `Couldn't list the estate's repos — ${board.rosterError}`
    : unreadable.length > 0
      ? `Couldn't read ${unreadable.join(", ")}`
      : null

  return { entries: [...repos, ...tickets, ...actions, ...launches], note }
}

function ticketEntry(ticket: BoardTicket, where: string): PaletteEntry {
  const repo = ticket.repo.slug
  return {
    id: `ticket:${ticket.repo.fullName}/${ticket.id}`,
    group: "tickets",
    label: ticket.title,
    meta: `${repo} / ${where}`,
    href: boardQuery("t", `${repo}/${ticket.id}`),
    status: STATUS[ticket.group],
    statusLabel: STATUS_LABEL[ticket.group],
  }
}

async function leadEntries(): Promise<{ entries: PaletteEntry[]; note: string | null }> {
  try {
    const clients = await listClients({ archived: false })
    return {
      entries: clients.map((client) => ({
        id: `lead:${client.id}`,
        group: "leads",
        // The company rides in the meta so a search for it finds the person.
        label: client.name,
        meta: [client.company, clientStatusLabel(client.status)]
          .filter(Boolean)
          .join(" · "),
        href: `/leads/${client.id}`,
      })),
      note: null,
    }
  } catch {
    return { entries: [], note: "Leads couldn't be read" }
  }
}

/** The palette's whole index. Never throws: a source that fails drops its
 *  rows and leaves a note, and the other source still answers. */
export async function loadPaletteIndex(): Promise<PaletteIndex> {
  const [board, leads] = await Promise.all([boardEntries(), leadEntries()])
  return {
    entries: [...board.entries, ...leads.entries],
    notes: [board.note, leads.note].filter((n): n is string => n !== null),
  }
}
