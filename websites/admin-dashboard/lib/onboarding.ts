import "server-only"

import {
  parseOnboardingForm,
  type FormSnapshot,
} from "@jamie-nisbet/services"

// The questionnaire library, parsed into the snapshot shape the send action
// freezes onto a link row. The grammar is documented for humans in icm-board's
// `workspaces/sell/references/forms/README.md`; the parser is
// `@jamie-nisbet/services`' `parseOnboardingForm`, shared with the portfolio's
// `/start` page so the two cannot drift.
//
// Questionnaires come from **two repos**, the same way the tickets board reads
// `.icm/intake/` from every connected repo rather than from one:
//
//   - The *house* library — `workspaces/sell/references/forms/` in
//     **icm-board**, the deal workspace's own folder (moved there from this
//     repo's `.icm/onboarding/` on 2026-09-22, icm-board decision D24: the
//     questions are business knowledge and live with the sell workspace; the
//     answers are Neon's). Offered on every lead.
//   - The lead's own *delivery repo* (`biz.clients.github_repo`, the same field
//     the tickets board rosters from) — `.icm/onboarding/` there holds
//     questionnaires written for that one client, offered only on their
//     profile.
//
// Neither folder is on this deployment's disk any more, so both are read over
// the read-only contents API with the same `GITHUB_TOKEN` the tickets board and
// the client-repo scaffold use (Contents: read on icm-board is already needed
// for the scaffold). Reading is deliberately dumb: each folder holds a handful
// of small files, so every call loads all of them and picks. Every fetch opts
// into the cache with `force-cache` + a 60-second revalidate, for the reasons
// `lib/tickets.ts`'s header spells out.

const HOUSE_REPO = "k0d0minio/icm-board"
const HOUSE_FOLDER = "workspaces/sell/references/forms"
const CLIENT_FOLDER = ".icm/onboarding"
const REVALIDATE_SECONDS = 60

/**
 * What the picker submits and the send action resolves: a bare slug for a house
 * form, or `<repo-name>/<slug>` for one out of the lead's delivery repo. Slugs
 * can't contain a slash, so the two spaces can never collide — a client repo is
 * free to carry its own `intake-diagnostic.md` without shadowing the house one.
 *
 * A slug is also a filename, so this is checked before either half is ever
 * joined to a path or a contents-API URL.
 */
const FORM_ID = /^(?:[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/

/** "owner/name" → "name", the half worth showing on screen. */
const repoName = (fullName: string) => fullName.split("/").pop() ?? fullName

/** House forms keep the bare slug as their id (stable across the move); a
 * client repo's forms are prefixed with the repo name. */
function formId(slug: string, sourceRepo: string | null): string {
  return sourceRepo === null || sourceRepo === HOUSE_REPO
    ? slug
    : `${repoName(sourceRepo)}/${slug}`
}

// ---------------------------------------------------------------------------
// Sources.

type RawForm = {
  slug: string
  markdown: string
  sourceRepo: string
  sourcePath: string
}

/** One repo's contribution. `error` is a sentence for the dashboard's banner —
 * a repo that simply has no questionnaire folder yields neither forms nor an
 * error, the same way the tickets board treats a missing `.icm/intake/`. */
type SourceResult = { forms: RawForm[]; error: string | null }

const isFormFile = (name: string) =>
  name.endsWith(".md") && name.toLowerCase() !== "readme.md"

async function gh(path: string, accept: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    // Opt in explicitly — a revalidate alone caches nothing on a request that
    // carries an Authorization header (see lib/tickets.ts).
    cache: "force-cache",
    next: { revalidate: REVALIDATE_SECONDS, tags: ["onboarding-forms"] },
  })
}

/**
 * One repo's questionnaire folder over the read-only contents API — the house
 * library in icm-board and a client's delivery repo alike, which is what makes
 * the two one code path.
 */
async function readFromGithub(fullName: string, folder: string): Promise<SourceResult> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      forms: [],
      error: `Couldn't read ${fullName} — GITHUB_TOKEN isn't set on this deployment.`,
    }
  }
  try {
    const listing = await gh(
      `/repos/${fullName}/contents/${folder}`,
      "application/vnd.github+json"
    )
    // No folder on main just means this repo carries no questionnaires — the
    // common case for a delivery repo, and not something to put a banner on
    // the lead's profile about.
    if (listing.status === 404) return { forms: [], error: null }
    if (!listing.ok) {
      return {
        forms: [],
        error: `Couldn't read ${folder}/ in ${fullName} — GitHub returned HTTP ${listing.status}.`,
      }
    }
    const entries = (await listing.json()) as { type: string; name: string }[]
    const names = entries
      .filter((e) => e.type === "file" && isFormFile(e.name))
      .map((e) => e.name)
      .sort()

    const forms = await Promise.all(
      names.map(async (name) => {
        const res = await gh(
          `/repos/${fullName}/contents/${folder}/${encodeURIComponent(name)}`,
          "application/vnd.github.raw+json"
        )
        if (!res.ok) return null
        return {
          slug: name.replace(/\.md$/, ""),
          markdown: await res.text(),
          sourceRepo: fullName,
          sourcePath: `${folder}/${name}`,
        }
      })
    )
    return { forms: forms.filter((f) => f !== null), error: null }
  } catch (err) {
    return {
      forms: [],
      error: `Couldn't read ${folder}/ in ${fullName} — ${
        err instanceof Error ? err.message : "network error"
      }.`,
    }
  }
}

/**
 * Every questionnaire on offer for one lead: the house library plus, when the
 * lead has a delivery repo connected, that repo's own. Their forms come first —
 * a questionnaire written for this client is the one you reached for the button
 * to send, and it is what the picker preselects.
 *
 * Best-effort per source, like the tickets board: an unreachable client repo
 * becomes a banner on the profile, not a picker with nothing in it.
 */
async function readAll(clientRepo: string | null): Promise<SourceResult> {
  // A lead connected to icm-board itself would otherwise have the house
  // library listed twice.
  const secondSource = clientRepo === HOUSE_REPO ? null : clientRepo

  const [house, client] = await Promise.all([
    readFromGithub(HOUSE_REPO, HOUSE_FOLDER),
    secondSource ? readFromGithub(secondSource, CLIENT_FOLDER) : null,
  ])

  const errors = [house.error, client?.error ?? null].filter(
    (e): e is string => e !== null
  )

  return {
    forms: [...(client?.forms ?? []), ...house.forms],
    error: errors.length > 0 ? errors.join(" ") : null,
  }
}

// ---------------------------------------------------------------------------
// The two calls the dashboard makes.

/** What the "Send form" picker lists. A file that doesn't parse is reported
 * beside the ones that do, so a typo in one questionnaire doesn't take the
 * whole picker down — and says which file, in which repo, and what's wrong. */
export type FormChoice = {
  /** What the picker submits back: a slug, or `<repo-name>/<slug>`. */
  id: string
  slug: string
  title: string
  questionCount: number
  /** "owner/name" this came from — icm-board for the house library. */
  sourceRepo: string | null
}

export async function listOnboardingForms(clientRepo: string | null): Promise<{
  forms: FormChoice[]
  errors: string[]
}> {
  const { forms: raw, error } = await readAll(clientRepo)

  const forms: FormChoice[] = []
  const errors: string[] = error === null ? [] : [error]
  for (const { slug, markdown, sourceRepo, sourcePath } of raw) {
    try {
      const snapshot = parseOnboardingForm(slug, markdown, sourceRepo, sourcePath)
      forms.push({
        id: formId(slug, sourceRepo),
        slug,
        title: snapshot.title,
        questionCount: snapshot.fields.length,
        sourceRepo,
      })
    } catch (err) {
      errors.push(
        err instanceof Error ? err.message : `${slug}.md is malformed.`
      )
    }
  }
  return { forms, errors }
}

/**
 * Parse one questionnaire, ready to be frozen onto a link. Throws with a
 * message meant to be read in the dashboard — the send action surfaces it
 * rather than storing a half-parsed form.
 *
 * Resolution is scoped to the same lead the picker was drawn for, so an id can
 * only ever name a form that lead was actually offered — a client-repo slug
 * can't be sent to someone else by hand-editing the request.
 */
export async function loadOnboardingForm(
  clientRepo: string | null,
  id: string
): Promise<FormSnapshot> {
  if (!FORM_ID.test(id)) throw new Error(`"${id}" isn't a valid form name.`)

  const { forms } = await readAll(clientRepo)
  const found = forms.find((f) => formId(f.slug, f.sourceRepo) === id)
  if (!found) {
    throw new Error(
      id.includes("/")
        ? `There's no ${CLIENT_FOLDER}/${id.split("/").pop()}.md in this lead's repo.`
        : `There's no ${HOUSE_FOLDER}/${id}.md in ${HOUSE_REPO}.`
    )
  }

  return parseOnboardingForm(found.slug, found.markdown, found.sourceRepo, found.sourcePath)
}
