// Printing. No colours, no spinners, no dependencies — these scripts are read
// in a terminal beside a phone and a list, and the only thing that matters is
// that the operator can see what happened and what is about to.

/** A blank line, or a line of text. */
export function line(text = ""): void {
  console.log(text)
}

/** A section, with a rule under it so a long run stays scannable. */
export function heading(text: string): void {
  console.log("")
  console.log(text)
  console.log("─".repeat(Math.min(text.length, 72)))
}

export function bullet(text: string): void {
  console.log(`  · ${text}`)
}

/** Something that went wrong on one row, without stopping the run. */
export function warn(text: string): void {
  console.log(`  ! ${text}`)
}

/** The banner every writing script prints before it does anything, so the run
 *  says which mode it is in at the top rather than at the bottom. */
export function dryRunBanner(): void {
  console.log("DRY RUN — nothing will be written.")
}

/** What a script did, one line, at the end. */
export function done(text: string): void {
  console.log("")
  console.log(text)
}

/** Stop, with a reason on stderr and a non-zero exit. */
export function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

/** "1 lead" / "4 leads" — worth a helper only because these scripts count
 *  things in every other line. */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}

export type TableOptions = {
  head?: readonly string[]
  /** Widest a single cell may print before it is cut. Keeps a hook or a note
   *  from pushing the columns off the right of the terminal. */
  max?: number
  indent?: string
}

/**
 * Column-aligned rows. Cells are trimmed to `max` (default 40) with an ellipsis,
 * and the last column is never padded, so a wide final cell costs nothing.
 */
export function table(rows: readonly (readonly string[])[], opts: TableOptions = {}): void {
  if (rows.length === 0) return
  const max = opts.max ?? 40
  const indent = opts.indent ?? "  "

  const body = rows.map((row) => row.map((cell) => clip(cell ?? "", max)))
  const all = opts.head ? [opts.head.map((h) => clip(h, max)), ...body] : body
  const columns = Math.max(...all.map((row) => row.length))
  const widths: number[] = []
  for (let column = 0; column < columns; column++) {
    widths[column] = Math.max(...all.map((row) => (row[column] ?? "").length))
  }

  const render = (row: readonly string[]) =>
    indent +
    row
      .map((cell, column) =>
        column === row.length - 1 ? cell : cell.padEnd(widths[column])
      )
      .join("  ")
      .trimEnd()

  if (opts.head) {
    console.log(render(opts.head.map((h) => clip(h, max))))
    console.log(
      indent +
        widths
          .slice(0, columns)
          .map((width) => "─".repeat(width))
          .join("  ")
    )
  }
  for (const row of body) console.log(render(row))
}

function clip(value: string, max: number): string {
  const flat = value.replace(/\s+/g, " ").trim()
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`
}

/** `YYYY-MM-DD` in local time — every date these scripts print. */
export function day(at: Date | null | undefined): string {
  if (!at) return "—"
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

/** How far off a date is, in the words a queue uses: "overdue 3d", "today",
 *  "in 5d". */
export function relativeDay(at: Date | null | undefined, now = new Date()): string {
  if (!at) return "—"
  const days = Math.round(
    (startOfDay(at).getTime() - startOfDay(now).getTime()) / 86_400_000
  )
  if (days === 0) return "today"
  if (days < 0) return `overdue ${-days}d`
  return `in ${days}d`
}

function startOfDay(at: Date): Date {
  const midnight = new Date(at.getTime())
  midnight.setHours(0, 0, 0, 0)
  return midnight
}
