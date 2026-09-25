"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArchiveRestore, Check, Mail, MessageCircle, Trash2 } from "lucide-react"

import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  DeskButton,
  DeskSegmentedControl,
  cn,
  toast,
} from "@jamie-nisbet/ui"

import { archiveClient, markTouched, removeClient } from "@/app/(app)/actions"
import type { LeadSort, LeadSortKey } from "@/lib/leads"

// The Leads screen at the desk, as a table (leads-table-board, D-19).
//
// The server does the reading, the sorting and the wording — every cell
// arrives as text in `LeadRowView` — so this component only owns what needs a
// browser: the header clicks that write the sort into the URL, the row that
// opens the lead, the three row actions, and the keyboard (D-32).
//
// A row is a real table row with a real link in its name cell, so Tab, a
// middle-click and a screen reader all find the lead; the click anywhere else
// on the row is the pointer's shortcut to the same place.

/** One lead as the table and the board show it — every cell already worded. */
export type LeadRowView = {
  id: string
  name: string
  /** Under the name: the company, or what the row is when there is none. */
  sub: string | null
  monogram: string
  /** A past client, a lost lead, a parked prospect: still listed, not live. */
  muted: boolean
  status: string
  stage: { code: string; name: string } | null
  /** The headline figure, as the list has always worded it. */
  value: string | null
  /** The next action's text; `planned: false` is the "Nothing planned" crack. */
  next: { text: string; planned: boolean } | null
  due: { text: string; overdue: boolean } | null
  /** Since the last touch; `alarm` when an open lead has waited too long. */
  last: { text: string; alarm: boolean }
  tier: string | null
  whatsappUrl: string | null
  email: string | null
}

const COLUMNS: {
  key: LeadSortKey
  label: string
  width: string
  align?: "end"
}[] = [
  { key: "name", label: "Name", width: "w-64" },
  { key: "status", label: "Status", width: "w-32" },
  { key: "stage", label: "Deal stage", width: "w-32" },
  { key: "value", label: "Value", width: "w-40", align: "end" },
  { key: "next", label: "Next step", width: "w-60" },
  { key: "due", label: "Due", width: "w-24" },
  { key: "last", label: "Last worked", width: "w-32" },
  { key: "tier", label: "Tier", width: "w-14" },
]

/** Tailwind's `md` — where the shell swaps the tab bar for the rail and this
 *  screen for its phone rows. Below it the table isn't on screen, so its
 *  keys aren't either. */
const DESK_QUERY = "(min-width: 48rem)"

/** Anything floating over the screen owns the keys while it is open — the
 *  palette, the add-lead sheet, a confirm. Radix mounts these only while
 *  open, so being in the document is being open. */
const OVERLAY = '[role="menu"], [role="dialog"], [role="alertdialog"]'

const TEXT_FIELD =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/** Controls whose own Enter is theirs — a link, a row action. */
const ACTIVATABLE = 'button, a[href], summary, [role="menuitem"]'

export function LeadsTable({
  rows,
  sort,
  sortHrefs,
  archived,
}: {
  rows: LeadRowView[]
  /** The order on screen — the URL's, or the view's default when it is one
   *  a column can name (longest-waiting first is Last worked, descending). */
  sort: LeadSort | null
  /** Where each header's click goes: the column in its first direction, or
   *  the current column reversed. */
  sortHrefs: Record<LeadSortKey, string>
  archived: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  // Rows restored or deleted from the archive leave on the click; the
  // revalidation that follows takes them out for real. A refused write puts
  // the row back, which is why the failure toast names what didn't happen.
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set())
  // The keyboard's highlight, held by id so a re-sort or a revalidation that
  // reorders the rows keeps it on the same lead — and drops it when that lead
  // is no longer listed.
  const [highlight, setHighlight] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())

  const visible = rows.filter((row) => !gone.has(row.id))
  const highlighted = visible.some((row) => row.id === highlight) ? highlight : null

  function leave(id: string, run: () => Promise<void>, done: string, failed: string) {
    setGone((prev) => new Set(prev).add(id))
    startTransition(async () => {
      try {
        await run()
        toast(done)
      } catch {
        setGone((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.error(failed)
      }
    })
  }

  function touch(row: LeadRowView) {
    startTransition(async () => {
      try {
        await markTouched(row.id)
        toast(`Marked ${row.name} as worked today`)
      } catch {
        toast.error(`Couldn't mark ${row.name} touched`)
      }
    })
  }

  function restore(row: LeadRowView) {
    leave(
      row.id,
      () => archiveClient(row.id, false),
      `Restored ${row.name}`,
      `Couldn't restore ${row.name}`
    )
  }

  function remove(row: LeadRowView) {
    if (!confirm("Permanently delete this lead? This can't be undone.")) return
    leave(
      row.id,
      () => removeClient(row.id),
      `Deleted ${row.name}`,
      `Couldn't delete ${row.name}`
    )
  }

  // j / k / Enter / t (D-32). One listener on the document, attached once,
  // reading the latest rows, highlight and handlers through a ref.
  const keyState = useRef({ visible, highlighted, archived, touch, router })
  useEffect(() => {
    keyState.current = { visible, highlighted, archived, touch, router }
  })

  useEffect(() => {
    const desk = window.matchMedia(DESK_QUERY)

    function onKeyDown(event: KeyboardEvent) {
      if (!desk.matches) return
      if (event.defaultPrevented || event.isComposing) return
      // ⌘K / Ctrl+K and every other chord stay the browser's and the palette's.
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (!["j", "k", "Enter", "t"].includes(event.key)) return

      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(TEXT_FIELD)) return
      if (document.querySelector(OVERLAY)) return
      if (event.key === "Enter" && target?.closest(ACTIVATABLE)) return

      const {
        visible: list,
        highlighted: current,
        archived: inArchive,
        touch: markRow,
        router: nav,
      } = keyState.current
      if (list.length === 0) return
      const index = list.findIndex((row) => row.id === current)

      if (event.key === "j" || event.key === "k") {
        const nextIndex =
          index === -1
            ? event.key === "j"
              ? 0
              : list.length - 1
            : Math.min(
                list.length - 1,
                Math.max(0, index + (event.key === "j" ? 1 : -1))
              )
        const id = list[nextIndex].id
        setHighlight(id)
        rowRefs.current.get(id)?.scrollIntoView({ block: "nearest" })
        event.preventDefault()
        return
      }
      if (index === -1) return
      const row = list[index]
      if (event.key === "Enter") {
        nav.push(`/leads/${row.id}`)
        event.preventDefault()
      } else if (event.key === "t" && !inArchive) {
        markRow(row)
        event.preventDefault()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    // `table-fixed` with a width on every column: at a narrow desk the table
    // keeps its columns and the pane scrolls sideways, rather than squeezing
    // Next step to nothing.
    <DataGrid className="table-fixed">
      <colgroup>
        {COLUMNS.map((column) => (
          <col key={column.key} className={column.width} />
        ))}
        <col className="w-28" />
      </colgroup>
      <DataGridHeader>
        <DataGridRow>
          {COLUMNS.map((column) => (
            <DataGridHeaderCell
              key={column.key}
              align={column.align}
              sort={
                sort?.key === column.key
                  ? sort.dir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              onSort={() => router.push(sortHrefs[column.key], { scroll: false })}
            >
              {column.label}
            </DataGridHeaderCell>
          ))}
          <DataGridHeaderCell>
            <span className="sr-only">Actions</span>
          </DataGridHeaderCell>
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody>
        {visible.map((row) => (
          <DataGridRow
            key={row.id}
            ref={(node) => {
              if (node) rowRefs.current.set(row.id, node)
              else rowRefs.current.delete(row.id)
            }}
            selected={row.id === highlighted}
            className="cursor-pointer"
            onClick={(event) => {
              // A row action, or the name's own link, handles its own click.
              if ((event.target as Element).closest("a, button")) return
              router.push(`/leads/${row.id}`)
            }}
          >
            <DataGridCell>
              <Link
                href={`/leads/${row.id}`}
                className="flex min-w-0 items-center gap-2.5"
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-desk-sunken font-mono text-desk-micro text-desk-fg-2"
                >
                  {row.monogram}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate font-semibold",
                      row.muted ? "text-desk-fg-3" : "text-desk-fg"
                    )}
                  >
                    {row.name}
                  </span>
                  {row.sub ? (
                    <span className="truncate text-desk-meta text-desk-fg-3">
                      {row.sub}
                    </span>
                  ) : null}
                </span>
              </Link>
            </DataGridCell>
            <DataGridCell className="text-desk-fg-2">{row.status}</DataGridCell>
            <DataGridCell className="font-mono text-desk-meta text-desk-fg-2">
              {row.stage ? `${row.stage.code} ${row.stage.name}` : "—"}
            </DataGridCell>
            <DataGridCell
              numeric
              className={cn(
                "font-medium",
                row.muted ? "text-desk-fg-3" : "text-desk-fg"
              )}
            >
              {row.value ?? "—"}
            </DataGridCell>
            <DataGridCell
              className={
                row.next?.planned ? "text-desk-fg" : "text-desk-fg-3"
              }
              title={row.next?.planned ? row.next.text : undefined}
            >
              {row.next ? row.next.text : "—"}
            </DataGridCell>
            <DataGridCell
              className={cn(
                "font-mono text-desk-meta",
                row.due?.overdue ? "font-medium text-desk-blocked" : "text-desk-fg-2"
              )}
            >
              {row.due ? row.due.text : "—"}
            </DataGridCell>
            <DataGridCell
              className={cn(
                "font-mono text-desk-meta",
                row.last.alarm ? "font-medium text-desk-blocked" : "text-desk-fg-2"
              )}
            >
              {row.last.text}
            </DataGridCell>
            <DataGridCell className="font-mono text-desk-meta">
              {row.tier ? (
                <>
                  <span aria-hidden>{row.tier}</span>
                  <span className="sr-only">Tier {row.tier}</span>
                </>
              ) : (
                "—"
              )}
            </DataGridCell>
            <DataGridCell>
              <span className="flex items-center justify-end gap-0.5 text-desk-fg-3">
                {archived ? (
                  <>
                    <DeskButton
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Restore ${row.name}`}
                      title="Restore"
                      onClick={() => restore(row)}
                    >
                      <ArchiveRestore aria-hidden />
                    </DeskButton>
                    <DeskButton
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${row.name}`}
                      title="Delete"
                      onClick={() => remove(row)}
                    >
                      <Trash2 aria-hidden />
                    </DeskButton>
                  </>
                ) : (
                  <>
                    {row.whatsappUrl ? (
                      // WhatsApp chat, not a call: the number opens the
                      // conversation and never surprise-dials the lead.
                      <DeskButton asChild variant="ghost" size="icon-sm">
                        <a
                          href={row.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp ${row.name}`}
                          title="WhatsApp"
                        >
                          <MessageCircle aria-hidden />
                        </a>
                      </DeskButton>
                    ) : (
                      <DeskButton
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        aria-label={`No phone number for ${row.name}`}
                        title="No phone number"
                      >
                        <MessageCircle aria-hidden />
                      </DeskButton>
                    )}
                    {row.email ? (
                      <DeskButton asChild variant="ghost" size="icon-sm">
                        <a
                          href={`mailto:${row.email}`}
                          aria-label={`Email ${row.name}`}
                          title="Email"
                        >
                          <Mail aria-hidden />
                        </a>
                      </DeskButton>
                    ) : (
                      <DeskButton
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        aria-label={`No email address for ${row.name}`}
                        title="No email address"
                      >
                        <Mail aria-hidden />
                      </DeskButton>
                    )}
                    <DeskButton
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Mark ${row.name} touched`}
                      title="Mark touched (t)"
                      aria-keyshortcuts="T"
                      onClick={() => touch(row)}
                    >
                      <Check aria-hidden />
                    </DeskButton>
                  </>
                )}
              </span>
            </DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  )
}

/** Table / Board (D-31) — a URL-backed choice, so it navigates rather than
 *  holding state: the layout survives a reload and a shared link. */
export function LeadsLayoutSwitch({
  layout,
  hrefs,
}: {
  layout: "table" | "board"
  hrefs: Record<"table" | "board", string>
}) {
  const router = useRouter()
  return (
    <DeskSegmentedControl
      aria-label="Leads layout"
      value={layout}
      onValueChange={(value) => router.push(hrefs[value], { scroll: false })}
      options={[
        { value: "table", label: "Table" },
        { value: "board", label: "Board" },
      ]}
    />
  )
}
