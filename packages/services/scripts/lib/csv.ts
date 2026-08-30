// A CSV reader, because the pool arrives as one.
//
// RFC 4180 with two concessions to reality: the delimiter is sniffed (a
// spreadsheet saved in a Portuguese locale writes `;`, and half the lists that
// reach this script were), and a BOM is stripped (Excel writes one). Quoted
// fields, embedded delimiters, embedded newlines and doubled quotes all work,
// because a hook is prose and prose has commas in it.
//
// Forty lines of parser rather than a dependency: this reads one file, once,
// on a laptop, and a parser you can read is worth more here than one that
// handles every dialect.

/** Split a whole CSV document into rows of cells. */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const source = text.replace(/^\uFEFF/, "")
  const sep = delimiter ?? sniffDelimiter(source)

  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let at = 0; at < source.length; at++) {
    const char = source[at]

    if (quoted) {
      if (char === '"') {
        if (source[at + 1] === '"') {
          cell += '"'
          at++
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === sep) {
      row.push(cell)
      cell = ""
    } else if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (char === "\r") {
      // Swallowed: the \n that follows ends the row.
    } else {
      cell += char
    }
  }

  // Whatever is left when the file ends, unless the file ended on a newline.
  if (cell !== "" || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((value) => value.trim() !== ""))
}

/** Comma or semicolon, whichever the header line has more of. Ties go to the
 *  comma, which is what "CSV" means everywhere except a Portuguese Excel. */
function sniffDelimiter(text: string): string {
  const header = text.slice(0, text.indexOf("\n") === -1 ? undefined : text.indexOf("\n"))
  const commas = (header.match(/,/g) ?? []).length
  const semicolons = (header.match(/;/g) ?? []).length
  return semicolons > commas ? ";" : ","
}

/**
 * The rows above, keyed by their header line.
 *
 * Duplicate headers keep the first (a list with two "phone" columns has one
 * phone column and a mistake); short rows read the missing cells as empty,
 * because a trailing empty column is what a spreadsheet omits.
 */
export function parseCsvRecords(
  text: string,
  delimiter?: string
): Record<string, string>[] {
  const rows = parseCsv(text, delimiter)
  const [header, ...body] = rows
  if (!header) return []

  return body.map((cells) => {
    const record: Record<string, string> = {}
    header.forEach((name, at) => {
      const key = name.trim()
      if (key === "" || key in record) return
      record[key] = (cells[at] ?? "").trim()
    })
    return record
  })
}
