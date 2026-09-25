import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { cn } from "../../lib/utils"

// DESK TIER — the data grid.
//
// A real <table>, so a screen reader walks it by row and column. A sticky
// 32px header in mono micro caps; 40px body rows (two lines of a name and
// its company fit) with a hairline under each; figures right-aligned in
// tabular mono; cells that never wrap. Give the table `table-fixed` and its
// columns widths (a <colgroup>, or widths on the header cells) and a cell
// that overflows ends in an ellipsis. It scrolls inside whatever contains
// it — a PaneBody — never the page.
//
//   <DataGrid>
//     <DataGridHeader>
//       <DataGridRow>
//         <DataGridHeaderCell sort="descending" onSort={…}>Last worked</DataGridHeaderCell>
//         <DataGridHeaderCell align="end">Value</DataGridHeaderCell>
//       </DataGridRow>
//     </DataGridHeader>
//     <DataGridBody>
//       <DataGridRow selected>
//         <DataGridCell>Casa do Largo</DataGridCell>
//         <DataGridCell numeric>€2,400</DataGridCell>
//       </DataGridRow>
//     </DataGridBody>
//   </DataGrid>
//
// A sortable column's header is a button inside the column header, and the
// column header carries aria-sort — where ARIA reads it. Sorting itself is
// the caller's: this renders the state it is given.
//
// Requires "@jamie-nisbet/ui/desk.css".

type DataGridSort = "ascending" | "descending" | "none"

function DataGrid({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="data-grid"
      className={cn(
        "w-full border-collapse text-left text-desk-ui text-desk-fg",
        className
      )}
      {...props}
    />
  )
}

function DataGridHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="data-grid-header" className={className} {...props} />
}

function DataGridBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="data-grid-body" className={className} {...props} />
}

type DataGridRowProps = React.ComponentProps<"tr"> & {
  /** This row is the current selection. */
  selected?: boolean
}

function DataGridRow({ selected = false, className, ...props }: DataGridRowProps) {
  return (
    <tr
      data-slot="data-grid-row"
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "h-desk-grid-row border-b border-desk-line transition-colors duration-100",
        "[tbody>&]:hover:bg-desk-hover",
        selected && "bg-desk-sunken [tbody>&]:hover:bg-desk-sunken",
        className
      )}
      {...props}
    />
  )
}

// The native `align` attribute (left / center / right, long deprecated) is
// replaced by the tier's start / end, so the two never intersect to `never`.
type DataGridHeaderCellProps = Omit<React.ComponentProps<"th">, "align"> & {
  /** The column's current sort. Pass with onSort to make it sortable. */
  sort?: DataGridSort
  /** Makes the column sortable: the header becomes a button. */
  onSort?: () => void
  align?: "start" | "end"
}

function DataGridHeaderCell({
  sort,
  onSort,
  align = "start",
  className,
  children,
  ...props
}: DataGridHeaderCellProps) {
  const sortable = onSort != null
  const Arrow =
    sort === "ascending" ? ArrowUpIcon : sort === "descending" ? ArrowDownIcon : null

  return (
    <th
      data-slot="data-grid-header-cell"
      scope="col"
      aria-sort={sortable ? (sort ?? "none") : undefined}
      className={cn(
        // Sticky on the cell, not the <thead>: it is the cell every engine
        // sticks reliably inside a scrolling container.
        "sticky top-0 z-10 h-desk-grid-header border-b border-desk-line bg-desk-surface px-2.5 font-mono text-desk-micro tracking-desk-eyebrow whitespace-nowrap text-desk-fg-3 uppercase first:pl-5 last:pr-4",
        align === "end" ? "text-right" : "text-left",
        className
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "inline-flex items-center gap-1 uppercase transition-colors duration-100 hover:text-desk-fg",
            sort != null && sort !== "none" && "text-desk-fg",
            align === "end" && "flex-row-reverse"
          )}
        >
          {children}
          {Arrow && <Arrow aria-hidden className="size-desk-check" />}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

type DataGridCellProps = Omit<React.ComponentProps<"td">, "align"> & {
  /** A figure: right-aligned, tabular mono. */
  numeric?: boolean
  align?: "start" | "end"
}

function DataGridCell({
  numeric = false,
  align,
  className,
  ...props
}: DataGridCellProps) {
  return (
    <td
      data-slot="data-grid-cell"
      className={cn(
        "truncate px-2.5 first:pl-5 last:pr-4",
        (numeric || align === "end") && "text-right",
        numeric && "font-mono text-desk-meta tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  type DataGridCellProps,
  type DataGridHeaderCellProps,
  type DataGridRowProps,
  type DataGridSort,
}
