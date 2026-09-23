import "server-only"

// The dashboard's read-only line to the deal workspace in icm-board
// (`workspaces/deals/<repo name>/…`, icm-board decisions D24–D25 and D28). One
// home per fact: business *state* is the Neon row, the *documents* live in that
// folder — named after the row's delivery repo, so nothing has to be stored —
// and this module only ever reads — the stage a deal is at (positional: the
// highest `NN-` artefact in the live engagement), the agreement's header, the
// Drive link — so the profile can show them beside the rung and say when the two
// cannot both be true. Nothing here writes state from the folder, and nothing
// syncs: the one write in the other direction is the form-answer snapshot
// `writeFormAnswersToRepo` commits, immutable and provenance-stamped.
//
// Same caching discipline as `lib/tickets.ts`, for the same reason (read that
// file's header before adding a fetch): every read opts in with
// `cache: "force-cache"` — a revalidate alone caches nothing on a request that
// carries an Authorization header, and every one of these does — and no route
// that calls this may export `dynamic = "force-dynamic"`, which sets
// `fetchCache: "force-no-store"` across its segment and re-reads icm-board on
// every render. Two clocks: the folder listing on a minute (one recursive
// git-tree call for the whole `workspaces/deals/` tree), file contents by blob
// SHA on a month (content-addressed, so a SHA read can never go stale — the
// tree read is what notices a file changed). All of it tagged, so the board's
// refresh control busts it in one `revalidateTag`.
//
// Reuses the delivery-repo `GITHUB_TOKEN`, which already reads icm-board for
// the client-repo scaffold (`lib/icm-scaffold.ts`); Contents: read on
// `k0d0minio/icm-board` is enough for everything here.

export const DEALS_REPO = "k0d0minio/icm-board"
export const DEALS_PATH = "workspaces/deals"

const API = "https://api.github.com"
const TREE_REVALIDATE_SECONDS = 60
const BLOB_REVALIDATE_SECONDS = 60 * 60 * 24 * 30
export const DEALS_CACHE_TAG = "icm-board-deals"

/** The deal folder is named after the delivery repo (icm-board D28): the
 *  `name` half of `github_repo`'s "owner/name". Null when the row has no repo
 *  yet — the folder can only be found once the repo is connected or created. */
export function dealFolderSlug(githubRepo: string | null | undefined): string | null {
  if (!githubRepo) return null
  const name = githubRepo.split("/").pop()?.trim().toLowerCase() ?? ""
  return name === "" ? null : name
}

/** The eight stages of one engagement, by their `NN-` prefix. */
export const STAGE_NAMES: Record<string, string> = {
  "01": "intake",
  "02": "look",
  "03": "quote",
  "04": "proposal",
  "05": "agreement",
  "06": "onboarding",
  "07": "kickoff",
  "08": "handover",
}

export type DealStage = { code: string; name: string }

export type DealAgreement = {
  tier: string | null
  shape: string | null
  /** EUR minor units, parsed from `- agreed: <EUR>`; null when unparseable. */
  agreedMinor: number | null
  /** EUR minor units per month from `- recurring:`; 0 for "none". */
  recurringMinor: number | null
  /** "pending", or the ISO date it was signed. */
  signed: string | null
  drive: string | null
}

export type DealFolder = {
  slug: string
  /** GitHub URL of the client folder. */
  htmlUrl: string
  repo: string | null
  language: string | null
  /** The live engagement slug, or null for `none`. */
  engagement: string | null
  /** The live engagement's stage — null when there is no engagement, or no
   *  `NN-` artefact in it yet. */
  stage: DealStage | null
  agreement: DealAgreement | null
  /** From the Engagements table: does the live engagement's row have an
   *  `ended` value? Null when the table or the row could not be read. */
  engagementEnded: boolean | null
  /** A sentence when the folder could not be read as expected. */
  error: string | null
}

function configured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

async function gh(path: string, accept: string, revalidate: number): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "force-cache",
    next: { revalidate, tags: [DEALS_CACHE_TAG] },
  })
}

type TreeEntry = { path: string; type: string; sha: string }

/** The whole `workspaces/deals/` tree, once per minute. Null when unreadable. */
async function readDealsTree(): Promise<TreeEntry[] | null> {
  if (!configured()) return null
  try {
    const res = await gh(
      `/repos/${DEALS_REPO}/git/trees/HEAD?recursive=1`,
      "application/vnd.github+json",
      TREE_REVALIDATE_SECONDS
    )
    if (!res.ok) return null
    const { tree } = (await res.json()) as { tree: TreeEntry[] }
    return tree.filter((e) => e.path.startsWith(`${DEALS_PATH}/`))
  } catch {
    return null
  }
}

async function readBlob(sha: string): Promise<string | null> {
  try {
    const res = await gh(
      `/repos/${DEALS_REPO}/git/blobs/${sha}`,
      "application/vnd.github.raw+json",
      BLOB_REVALIDATE_SECONDS
    )
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

/** `- key: value` header lines, first occurrence wins, stopped at the first `##`. */
function dashFields(markdown: string): Map<string, string> {
  const fields = new Map<string, string>()
  for (const line of markdown.split("\n")) {
    if (/^##\s/.test(line)) break
    const m = line.match(/^-\s+([a-z][a-z-]*):\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    if (!fields.has(key)) fields.set(key, m[2].replace(/\s+#.*$/, "").trim())
  }
  return fields
}

/** "€7,500" · "7500" · "€7.500,00" → minor units; "none" → 0; junk → null. */
function euroMinor(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const text = raw.trim().toLowerCase()
  if (text === "" || text === "none" || text === "—" || text === "-") return 0
  const digits = text.replace(/[^0-9.,]/g, "")
  if (!digits) return null
  // Thousands separators are whichever mark is followed by exactly three digits.
  const normalized = digits.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".")
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value * 100) : null
}

/** The live engagement's row in `## Engagements` — has its `ended` cell a value? */
function engagementEndedIn(markdown: string, engagement: string): boolean | null {
  const lines = markdown.split("\n")
  const start = lines.findIndex((l) => /^##\s+Engagements/i.test(l))
  if (start === -1) return null
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    if (!line.startsWith("|")) continue
    const cells = line.split("|").map((c) => c.trim())
    // ["", slug, shape, started, ended, outcome, ""]
    if (cells[1] === engagement) return (cells[4] ?? "") !== ""
  }
  return null
}

function stageOf(tree: TreeEntry[], slug: string, engagement: string): DealStage | null {
  const prefix = `${DEALS_PATH}/${slug}/${engagement}/`
  let best: string | null = null
  for (const entry of tree) {
    if (entry.type !== "blob" || !entry.path.startsWith(prefix)) continue
    const rest = entry.path.slice(prefix.length)
    if (rest.includes("/")) continue // answers/, raw/, private/ are not stages
    const m = rest.match(/^(0[1-8])-.+\.md$/)
    if (m && (best === null || m[1] > best)) best = m[1]
  }
  return best ? { code: best, name: STAGE_NAMES[best] ?? best } : null
}

async function readFolder(tree: TreeEntry[], slug: string): Promise<DealFolder> {
  const htmlUrl = `https://github.com/${DEALS_REPO}/tree/HEAD/${DEALS_PATH}/${slug}`
  const base: DealFolder = {
    slug,
    htmlUrl,
    repo: null,
    language: null,
    engagement: null,
    stage: null,
    agreement: null,
    engagementEnded: null,
    error: null,
  }
  const dealEntry = tree.find(
    (e) => e.type === "blob" && e.path === `${DEALS_PATH}/${slug}/DEAL.md`
  )
  if (!dealEntry) {
    return { ...base, error: `No ${DEALS_PATH}/${slug}/DEAL.md in ${DEALS_REPO} — the folder is named after the repo (D28): open the deal with /client in icm-board, or connect the right repo.` }
  }
  const deal = await readBlob(dealEntry.sha)
  if (deal === null) return { ...base, error: "DEAL.md could not be read from GitHub." }

  const fields = dashFields(deal)
  const engagementRaw = fields.get("engagement") ?? null
  const engagement =
    engagementRaw && engagementRaw.toLowerCase() !== "none" ? engagementRaw : null
  const repoRaw = fields.get("repo") ?? null
  const repo = repoRaw && !/^(none|—|-)/i.test(repoRaw) ? repoRaw : null

  let stage: DealStage | null = null
  let agreement: DealAgreement | null = null
  let engagementEnded: boolean | null = null
  if (engagement) {
    stage = stageOf(tree, slug, engagement)
    engagementEnded = engagementEndedIn(deal, engagement)
    const agreementEntry = tree.find(
      (e) =>
        e.type === "blob" &&
        e.path === `${DEALS_PATH}/${slug}/${engagement}/05-agreement.md`
    )
    if (agreementEntry) {
      const text = await readBlob(agreementEntry.sha)
      if (text !== null) {
        const a = dashFields(text)
        agreement = {
          tier: a.get("tier") ?? null,
          shape: a.get("shape") ?? null,
          agreedMinor: euroMinor(a.get("agreed")),
          recurringMinor: euroMinor(a.get("recurring")),
          signed: a.get("signed") ?? null,
          drive: a.get("drive") ?? null,
        }
      }
    }
  }
  return {
    ...base,
    repo,
    language: fields.get("language") ?? null,
    engagement,
    stage,
    agreement,
    engagementEnded,
  }
}

/** One client's folder. Null when the dashboard has no GitHub token or the
 *  slug is null; a `DealFolder` with `error` set when the folder is missing. */
export async function readDealFolder(slug: string | null): Promise<DealFolder | null> {
  if (!slug || !configured()) return null
  const tree = await readDealsTree()
  if (tree === null) {
    return {
      slug,
      htmlUrl: `https://github.com/${DEALS_REPO}/tree/HEAD/${DEALS_PATH}/${slug}`,
      repo: null,
      language: null,
      engagement: null,
      stage: null,
      agreement: null,
      engagementEnded: null,
      error: `Could not list ${DEALS_REPO}'s deal folders (rate limit, or the token cannot read it).`,
    }
  }
  return readFolder(tree, slug)
}

/** The stage of every named folder, for the leads list's chips — one tree read
 *  plus one DEAL.md read per slug. Slugs with no folder are simply absent. */
export async function dealStages(slugs: (string | null)[]): Promise<Map<string, DealStage>> {
  const stages = new Map<string, DealStage>()
  const wanted = [...new Set(slugs.filter((s): s is string => Boolean(s)))]
  if (wanted.length === 0 || !configured()) return stages
  const tree = await readDealsTree()
  if (tree === null) return stages
  const folders = await Promise.all(wanted.map((slug) => readFolder(tree, slug)))
  for (const folder of folders) {
    if (folder.stage) stages.set(folder.slug, folder.stage)
  }
  return stages
}

/**
 * The badge (icm-board `CLIENTS.md` § The badge): the one line said when the
 * rung and the folder cannot both be true. Null when they can. A cue, never a
 * write — resolving it is Jamie's, in whichever home the wrong fact lives.
 */
export function dealBadge(status: string, folder: DealFolder | null): string | null {
  if (!folder || folder.error) return null
  const signedDate =
    folder.agreement?.signed && /^\d{4}-\d{2}-\d{2}/.test(folder.agreement.signed)
      ? folder.agreement.signed
      : null
  if (status === "active" && folder.engagement && !folder.agreement) {
    return "Active client with no 05-agreement.md in the live engagement — working without paper, or the rung is early."
  }
  if (status === "not_won" && folder.engagement && folder.engagementEnded === false) {
    return "Not won, but the folder's live engagement has no `ended` — close its row in DEAL.md."
  }
  if (status === "discussing" && signedDate) {
    return `Agreement signed ${signedDate}, but the rung is still In discussion — move it.`
  }
  return null
}
