import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"

import * as schema from "./schema"

// Lazily constructed so importing this package never throws at build/collection
// time when DATABASE_URL is absent (e.g. `next build` without a DB). The client
// is only created on first query.
let cached: NeonHttpDatabase<typeof schema> | null = null

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — cannot connect to the database. " +
        "Add it to the site's environment (see .env.example)."
    )
  }
  cached = drizzle(neon(url), { schema })
  return cached
}

// Convenience proxy so consumers can `import { db }` and use it directly; access
// is deferred to getDb() so nothing connects until the first property is read.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver)
  },
})
