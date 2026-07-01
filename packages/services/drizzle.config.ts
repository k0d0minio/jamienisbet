import { defineConfig } from "drizzle-kit"

// Migrations are authored from the Drizzle schema and applied against the shared
// Neon Postgres database (DATABASE_URL). Everything this repo owns lives under the
// dedicated `biz` Postgres schema so it never collides with anything else already
// using the same Neon database — schemaFilter keeps drizzle-kit scoped to it.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  schemaFilter: ["biz"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})
