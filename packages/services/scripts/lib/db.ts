import { fail, line } from "./out"

// Which database am I about to write to.
//
// These scripts are run from a laptop with more than one `DATABASE_URL` within
// reach, and the difference between the staging branch and production is a
// substring in an environment variable. So every script says the host out loud
// before it does anything, and the two that write say it before they write.
// It costs a line of output and it is the cheapest possible guard against the
// mistake nobody recovers from.

/** The connection's host, or a note that there isn't one. Never the password:
 *  this string is printed, and a credential that reaches a terminal scrollback
 *  is a credential in a log. */
export function databaseHost(): string {
  const url = process.env.DATABASE_URL
  if (!url) return "not set"
  try {
    return new URL(url).host || "unparseable"
  } catch {
    return "unparseable"
  }
}

/**
 * Stop unless there is a database to talk to, and say which one.
 *
 * Called at the top of every script rather than left to `getDb()`, which
 * throws the same complaint but only on the first query — by which point the
 * script has already read a file, parsed 85 rows and printed a plan.
 */
export function requireDatabase(): void {
  if (!process.env.DATABASE_URL) {
    fail(
      "DATABASE_URL is not set. These scripts talk to Neon directly:\n" +
        "  DATABASE_URL=… pnpm --filter @jamie-nisbet/services <script> -- …"
    )
  }
  line(`database: ${databaseHost()}`)
}
