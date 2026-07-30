import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

// Case studies are plain markdown + YAML frontmatter in content/work/*.md
// (ICM Principle 2 — plain text is the interface). This loader runs on the
// server at build/request time.

const WORK_DIR = path.join(process.cwd(), "content", "work")

export type CaseStudy = {
  slug: string
  title: string
  summary: string
  client: string
  year: number
  services: string[]
  stack: string[]
  outcome: string
  featured: boolean
  order: number
  cover?: string
  /** Public URL of the delivered site, when there is one to link to. */
  url?: string
  body: string
}

function readAll(): CaseStudy[] {
  if (!fs.existsSync(WORK_DIR)) return []
  return fs
    .readdirSync(WORK_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(WORK_DIR, file), "utf8")
      const { data, content } = matter(raw)
      const slug = (data.slug as string) || file.replace(/\.md$/, "")
      return {
        slug,
        title: (data.title as string) || slug,
        summary: (data.summary as string) || "",
        client: (data.client as string) || "Confidential",
        year: Number(data.year) || new Date().getFullYear(),
        services: (data.services as string[]) || [],
        stack: (data.stack as string[]) || [],
        outcome: (data.outcome as string) || "",
        featured: Boolean(data.featured),
        order: Number(data.order) || 999,
        cover: (data.cover as string) || undefined,
        url: (data.url as string) || undefined,
        body: content.trim(),
      } satisfies CaseStudy
    })
    .filter((study) => !study.slug.startsWith("_"))
}

export function getCaseStudies(): CaseStudy[] {
  return readAll().sort((a, b) => a.order - b.order || b.year - a.year)
}

/** Featured studies if any are flagged; otherwise everything. */
export function getFeaturedCaseStudies(): CaseStudy[] {
  const all = getCaseStudies()
  const featured = all.filter((study) => study.featured)
  return featured.length > 0 ? featured : all
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return readAll().find((study) => study.slug === slug)
}

export function getCaseStudySlugs(): string[] {
  return readAll().map((study) => study.slug)
}
