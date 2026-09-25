import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import { cn } from "@jamie-nisbet/ui"

import type { LeadRowView } from "@/components/leads-table"
import { STAGE_NAMES } from "@/lib/deals"

// The leads as a pipeline: one column per deal stage, 01 intake to 08
// handover, and a "No folder" column first for everyone whose stage can't be
// read (leads-table-board, D-19 and D-35).
//
// The stage is the deal folder's — the highest `NN-` artefact in the live
// engagement in icm-board — and this board only ever reads it. Nothing here
// is draggable and nothing writes: moving a deal is done in its folder, where
// the documents that make it true live. A card is a link to the lead, and
// that is all it does.
//
// The rows arrive already filtered and sorted (the view, the filter or crack,
// and the sort in the URL), so a column lists its cards in the same order the
// table would.

const COLUMNS: { code: string | null; name: string }[] = [
  { code: null, name: "No folder" },
  ...Object.entries(STAGE_NAMES).map(([code, name]) => ({ code, name })),
]

export function DealBoard({
  rows,
  readable,
}: {
  rows: LeadRowView[]
  /** False when icm-board's deal folders couldn't be listed at all — every
   *  card then sits under No folder, and the board says why. */
  readable: boolean
}) {
  return (
    <div className="flex min-h-full flex-col bg-desk-canvas">
      {readable ? null : (
        <p
          role="status"
          className="flex items-center gap-2 border-b border-desk-line px-5 py-2 text-desk-ui text-desk-fg-2"
        >
          <TriangleAlert aria-hidden className="size-desk-icon shrink-0" />
          Deal stages couldn&apos;t be read from icm-board, so every lead is
          under No folder.
        </p>
      )}
      <div className="flex flex-1 gap-2.5 px-5 py-3.5">
        {COLUMNS.map((column) => {
          const cards = rows.filter((row) =>
            column.code === null
              ? row.stage === null
              : row.stage?.code === column.code
          )
          const label = column.code
            ? `${column.code} ${column.name}`
            : column.name
          return (
            <section
              key={column.code ?? "none"}
              aria-label={`${label}, ${cards.length}`}
              className="flex w-40 shrink-0 flex-col gap-2"
            >
              <h2 className="flex items-baseline justify-between gap-2 border-b border-desk-line px-0.5 pb-1.5 font-mono text-desk-micro">
                <span className="truncate">
                  {column.code ? (
                    <>
                      <span className="font-semibold text-desk-fg">
                        {column.code}
                      </span>{" "}
                      <span className="text-desk-fg-2">{column.name}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-desk-fg">
                      {column.name}
                    </span>
                  )}
                </span>
                <span className="text-desk-fg-3 tabular-nums">
                  {cards.length}
                </span>
              </h2>
              <ul className="flex flex-col gap-2">
                {cards.map((row) => (
                  <li key={row.id}>
                    <DealCard row={row} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function DealCard({ row }: { row: LeadRowView }) {
  // The foot says the most pressing thing the lead has: a date if the next
  // step has one, else how long an open lead has waited once that is too
  // long, else simply where it is on the ladder.
  const foot = row.due
    ? { text: `due ${row.due.text}`, alarm: row.due.overdue }
    : row.last.alarm
      ? { text: row.last.text, alarm: true }
      : { text: row.status, alarm: false }

  return (
    <Link
      href={`/leads/${row.id}`}
      draggable={false}
      className={cn(
        "flex flex-col gap-1 rounded-desk-control border border-desk-line bg-desk-surface px-2.5 py-2",
        "transition-colors duration-100 hover:bg-desk-hover"
      )}
    >
      <span
        className={cn(
          "truncate text-desk-ui font-semibold",
          row.muted ? "text-desk-fg-3" : "text-desk-fg"
        )}
      >
        {row.name}
      </span>
      {row.value ? (
        <span className="truncate font-mono text-desk-meta text-desk-fg">
          {row.value}
        </span>
      ) : null}
      {row.next?.planned ? (
        <span className="line-clamp-2 text-desk-meta text-desk-fg-2">
          {row.next.text}
        </span>
      ) : null}
      <span
        className={cn(
          "truncate font-mono text-desk-micro",
          foot.alarm ? "font-medium text-desk-blocked" : "text-desk-fg-3"
        )}
      >
        {foot.text}
      </span>
    </Link>
  )
}
