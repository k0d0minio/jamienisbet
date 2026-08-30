// A flag parser small enough to read in one sitting, and strict on purpose.
//
// The strictness is the whole reason this exists rather than a hand-rolled
// `process.argv.includes("--dry-run")` in each script: an unknown flag is an
// error, not a shrug. `--dry-runn` on a script that writes to the database is
// a typo that would otherwise run for real, and finding out afterwards is not
// a recoverable position on an import of eighty strangers.

export type FlagSpec = {
  /** Flags that take a value: `--file leads.csv` or `--file=leads.csv`. */
  value?: readonly string[]
  /** Flags that are just present or absent: `--dry-run`. */
  boolean?: readonly string[]
}

export type Args = {
  values: Map<string, string>
  flags: Set<string>
  /** Anything that wasn't a flag, in order. */
  rest: string[]
}

export class UsageError extends Error {}

/**
 * Parse `argv` against a spec. Throws `UsageError` — which every script
 * catches and turns into its own `--help` — for an unknown flag, a value flag
 * with nothing after it, or a boolean flag given a value.
 *
 * `--help` and `-h` are always understood, so no script has to declare them.
 */
export function parseArgs(argv: readonly string[], spec: FlagSpec): Args {
  const takesValue = new Set(spec.value ?? [])
  const isBoolean = new Set([...(spec.boolean ?? []), "help"])

  const values = new Map<string, string>()
  const flags = new Set<string>()
  const rest: string[] = []

  for (let at = 0; at < argv.length; at++) {
    const token = argv[at]

    if (token === "-h") {
      flags.add("help")
      continue
    }
    if (!token.startsWith("--")) {
      rest.push(token)
      continue
    }
    if (token === "--") {
      rest.push(...argv.slice(at + 1))
      break
    }

    const equals = token.indexOf("=")
    const name = (equals === -1 ? token.slice(2) : token.slice(2, equals)).trim()
    const inline = equals === -1 ? null : token.slice(equals + 1)

    if (takesValue.has(name)) {
      if (inline !== null) {
        values.set(name, inline)
        continue
      }
      const next = argv[at + 1]
      if (next === undefined || next.startsWith("--")) {
        throw new UsageError(`--${name} needs a value`)
      }
      values.set(name, next)
      at++
      continue
    }

    if (isBoolean.has(name)) {
      if (inline !== null) throw new UsageError(`--${name} takes no value`)
      flags.add(name)
      continue
    }

    // A near-miss is the case worth naming: `--dry-runn` should say what it
    // meant, not just that it failed.
    const known = [...takesValue, ...isBoolean].sort()
    const near = known.find((k) => k.startsWith(name.slice(0, 4)) || name.startsWith(k))
    throw new UsageError(
      `unknown flag --${name}${near ? ` (did you mean --${near}?)` : ""}`
    )
  }

  return { values, flags, rest }
}

/** A required value flag, or a `UsageError` naming it. */
export function required(args: Args, name: string): string {
  const value = args.values.get(name)?.trim()
  if (!value) throw new UsageError(`--${name} is required`)
  return value
}

/** A whole number, or a `UsageError`. `min` guards the case that matters:
 *  `--limit 0` silently returning nothing. */
export function integer(
  args: Args,
  name: string,
  fallback: number,
  min = 1
): number {
  const raw = args.values.get(name)
  if (raw === undefined) return fallback
  const parsed = Number.parseInt(raw.trim(), 10)
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new UsageError(`--${name} must be a whole number ${min} or more`)
  }
  return parsed
}

/**
 * A date typed by a person: `YYYY-MM-DD`, or `today`, or `+3` for three days
 * from now. Anything a due date is ever set to from a terminal.
 */
export function date(
  args: Args,
  name: string,
  now: Date = new Date()
): Date | undefined {
  const raw = args.values.get(name)?.trim()
  if (!raw) return undefined
  return parseDate(raw, name, now)
}

export function parseDate(raw: string, name: string, now = new Date()): Date {
  const value = raw.trim().toLowerCase()

  if (value === "today") return now
  if (value === "tomorrow") return addDays(now, 1)

  const relative = /^\+(\d+)d?$/.exec(value)
  if (relative) return addDays(now, Number.parseInt(relative[1], 10))

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Midday rather than midnight: a due date is a day, and a timestamp at
    // 00:00 local is the previous day in any timezone west of here.
    const at = new Date(`${value}T12:00:00`)
    if (!Number.isNaN(at.getTime())) return at
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed

  throw new UsageError(
    `--${name} must be YYYY-MM-DD, "today", "tomorrow" or "+N" (days from now)`
  )
}

function addDays(from: Date, days: number): Date {
  const at = new Date(from.getTime())
  at.setDate(at.getDate() + days)
  return at
}
