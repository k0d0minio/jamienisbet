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
// Adding a tool: one file beside these, one line in `LAUNCH_TARGETS`. Parking
// one that doesn't work yet: its `parked` field.

import { claudeWeb } from "./claude-web"
import type { LaunchHint, LaunchRequest, LaunchTarget } from "./types"

export type { LaunchHint, LaunchMode, LaunchRequest, LaunchTarget } from "./types"
export {
  hintForMaintenance,
  hintForTicket,
  type HintSubject,
  type MaintenanceKind,
} from "./hint"

/** In menu order; the first is the default. */
export const LAUNCH_TARGETS: readonly LaunchTarget[] = [claudeWeb]

export const DEFAULT_TARGET_ID = "claude-web"

export function getTarget(id: string): LaunchTarget | null {
  return LAUNCH_TARGETS.find((t) => t.id === id) ?? null
}

/** The link for `req` on target `targetId`, or null when that target cannot
 * express it. An unknown id is a programming error, not a runtime state. */
export function launch(targetId: string, req: LaunchRequest): string | null {
  return targetOrThrow(targetId).build(req)
}

function targetOrThrow(targetId: string): LaunchTarget {
  const target = getTarget(targetId)
  if (!target) throw new Error(`Unknown launch target: ${targetId}`)
  return target
}

/** True when `targetId`'s link carries the whole recommendation — model and
 * effort both — so there is nothing left to say beside the button. */
export function carriesHint(targetId: string): boolean {
  const { supports } = targetOrThrow(targetId)
  return supports.model && supports.effort
}

/** "Opus · high" — the recommendation in `targetId`'s own model vocabulary;
 * the tier word itself for a tool with no model choice. */
export function hintLabel(targetId: string, hint: LaunchHint): string {
  const alias = targetOrThrow(targetId).modelAliases?.[hint.tier] ?? hint.tier
  return `${alias.charAt(0).toUpperCase()}${alias.slice(1)} · ${hint.effort}`
}

/**
 * A prompt body with one line naming the recommendation on top, for a target
 * whose link cannot carry it — so the session that receives it can see what
 * was meant even when the composer's pickers were left alone. Applied before
 * encoding, so it counts against the target's cap like any other character.
 * Never applied to a `/pipeline` verb: the router reads the first line.
 */
export function withHintLine(
  targetId: string,
  prompt: string,
  hint: LaunchHint | null
): string {
  if (!hint || carriesHint(targetId)) return prompt
  return `Recommended: ${hintLabel(targetId, hint)} effort.\n\n${prompt}`
}

/**
 * One way to start a launch, as the UI draws it: a menu entry beside the copy
 * that is every control's default action. Plain data, so it
 * crosses from a server component into the client menus as is — and the only
 * shape a component ever sees, which is what keeps every component free of a
 * tool's name.
 */
export type Launch = {
  targetId: string
  /** The registry's menu text, e.g. "Claude Code". */
  label: string
  surface: LaunchTarget["surface"]
  /** Null exactly when `unavailableReason` is set. */
  url: string | null
  /** "Opus · high" — the recommendation in this target's vocabulary, shown
   * beside it because its link can't carry it. Null when there is none, or
   * the link already carries it. */
  hint: string | null
  /** One line saying why this target can't express the launch. */
  unavailableReason: string | null
}

/** What the board asks for; `prompt` is the raw pick-up, before any
 * recommendation line. */
export type LaunchInput = Omit<LaunchRequest, "hint"> & {
  hint: LaunchHint | null
  /** Put the recommendation on top of the prompt, in each target's own
   * vocabulary, where its link can't carry it. Never for a `/pipeline` verb:
   * the router reads the first line. */
  hintLine: boolean
}

export const PROMPT_TOO_LONG = "Too long for a link — copy it into a new session"

/** Every registered target, in menu order, for one launch. The default target
 * is first (`LAUNCH_TARGETS` says so). A parked target is listed with its
 * reason and no link. */
export function launchesFor(input: LaunchInput): Launch[] {
  return LAUNCH_TARGETS.map((target) => {
    const prompt = input.hintLine
      ? withHintLine(target.id, input.prompt, input.hint)
      : input.prompt
    const url = target.parked
      ? null
      : target.build({
          repoFullName: input.repoFullName,
          prompt,
          mode: input.mode,
          hint: input.hint ?? undefined,
        })
    return {
      targetId: target.id,
      label: target.label,
      surface: target.surface,
      url,
      hint:
        input.hint && !carriesHint(target.id)
          ? hintLabel(target.id, input.hint)
          : null,
      unavailableReason: target.parked ?? (url === null ? PROMPT_TOO_LONG : null),
    }
  })
}

/** The default target's entry — the vocabulary the copied text's
 * recommendation line is written in, and the hint said beside a ticket. */
export function primaryLaunch(launches: readonly Launch[]): Launch | null {
  return (
    launches.find((l) => l.targetId === DEFAULT_TARGET_ID) ?? launches[0] ?? null
  )
}

/** A new tab for a web target; a custom scheme (a terminal, an IDE) is handed
 * to the OS in place, where a new tab would only leave a blank one behind. */
export function launchLinkProps(
  entry: Launch
): { target?: "_blank"; rel?: "noreferrer" } {
  return entry.surface === "web" ? { target: "_blank", rel: "noreferrer" } : {}
}
