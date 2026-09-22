import "server-only"

import { parseOnboardingForm, type FormSnapshot } from "@jamie-nisbet/services"

// The one thing the portfolio reads from icm-board: the free-look intake
// questionnaire, `workspaces/sell/references/forms/intake-diagnostic.md`, which
// the public `/start` page renders. The questions are business knowledge and
// live with the sell workspace (icm-board D24); this app only ever reads them,
// over the read-only GitHub contents API, and parses them with the same
// `parseOnboardingForm` the admin dashboard uses — so `/start` and a form the
// dashboard sends by link ask identical questions off identical markdown.
//
// Needs `GITHUB_TOKEN` on the portfolio deployment (icm-board is private;
// Contents: read is enough). Without it, or when GitHub is unreachable, the
// page shows its "email me instead" state rather than an empty form — a
// visitor is never shown a broken page because a token expired.
//
// Cached the way the dashboard caches its GitHub reads: an explicit
// `force-cache` (a revalidate alone caches nothing on a request carrying an
// Authorization header) on a one-minute clock, tagged.

export const ICM_BOARD_REPO = process.env.ICM_BOARD_REPO || "k0d0minio/icm-board"
export const INTAKE_FORM_PATH =
  process.env.ICM_BOARD_INTAKE_FORM || "workspaces/sell/references/forms/intake-diagnostic.md"
export const INTAKE_FORM_SLUG = "intake-diagnostic"
const REVALIDATE_SECONDS = 60

/** The intake questionnaire as a snapshot, or null when it cannot be read. */
export async function loadIntakeForm(): Promise<FormSnapshot | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null
  try {
    const res = await fetch(
      `https://api.github.com/repos/${ICM_BOARD_REPO}/contents/${INTAKE_FORM_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "force-cache",
        next: { revalidate: REVALIDATE_SECONDS, tags: ["icm-board-intake-form"] },
      }
    )
    if (!res.ok) return null
    const markdown = await res.text()
    return parseOnboardingForm(INTAKE_FORM_SLUG, markdown, ICM_BOARD_REPO, INTAKE_FORM_PATH)
  } catch {
    return null
  }
}
