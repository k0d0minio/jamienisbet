import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

// Posts are plain markdown + YAML frontmatter in content/posts/*.md, the same
// shape as content/work/. The house writes them; a post shows on the site only
// once its frontmatter says `ready: true`. This loader runs on the server at
// build/request time.

const POSTS_DIR = path.join(process.cwd(), "content", "posts")

export type Post = {
  slug: string
  title: string
  summary: string
  /** YYYY-MM-DD. */
  date: string
  body: string
}

// YAML reads an unquoted 2026-10-26 as a Date, a quoted one as a string.
function toDay(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return typeof value === "string" ? value.trim() : ""
}

function readAll(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8")
      const { data, content } = matter(raw)
      // `source` (the house path) stays in the file and is never read here.
      if (data.ready !== true) return []
      const slug = (data.slug as string) || file.replace(/\.md$/, "")
      return [
        {
          slug,
          title: (data.title as string) || slug,
          summary: (data.summary as string) || "",
          date: toDay(data.date),
          body: content.trim(),
        } satisfies Post,
      ]
    })
    .filter((post) => !post.slug.startsWith("_"))
}

/** Ready posts, newest first. */
export function getPosts(): Post[] {
  return readAll().sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): Post | undefined {
  return readAll().find((post) => post.slug === slug)
}

export function getPostSlugs(): string[] {
  return readAll().map((post) => post.slug)
}

/** The post's date in the locale's long form, e.g. "26 October 2026". */
export function formatPostDate(date: string, lang: string): string {
  const day = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(day.getTime())) return date
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(day)
}
