// The launcher registry. Every session link the board emits — a ticket row, a
// batch sheet, a maintenance button — is a pre-filled link that a human sends,
// which is what keeps the board read-only. Each tool is a target in its own
// file, and the comment on each names the doc its URL shape comes from, so the
// next reader can tell a documented URL from a guess. A tool with no documented
// link shape does not get a target.
//
// The board used to point at `claude.ai/code?prompt=…&repositories=…`, which
// is neither documented nor versioned — the request to document it was closed
// *not planned* — so it could change under us without notice.
//
// Adding a tool: one file beside these, one line in `LAUNCH_TARGETS`.

import { claudeTerminal } from "./claude-terminal"
import { claudeWeb } from "./claude-web"
import type { LaunchRequest, LaunchTarget } from "./types"

export type { LaunchHint, LaunchMode, LaunchRequest, LaunchTarget } from "./types"

/** In menu order; the first is the default. */
export const LAUNCH_TARGETS: readonly LaunchTarget[] = [claudeWeb, claudeTerminal]

export const DEFAULT_TARGET_ID = "claude-web"

export function getTarget(id: string): LaunchTarget | null {
  return LAUNCH_TARGETS.find((t) => t.id === id) ?? null
}

/** The link for `req` on target `targetId`, or null when that target cannot
 * express it. An unknown id is a programming error, not a runtime state. */
export function launch(targetId: string, req: LaunchRequest): string | null {
  const target = getTarget(targetId)
  if (!target) throw new Error(`Unknown launch target: ${targetId}`)
  return target.build(req)
}
