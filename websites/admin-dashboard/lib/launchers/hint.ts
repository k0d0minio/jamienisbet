// The model/effort recommendation for a launch — derived, never authored
// (session-launchers decision 2): no stub carries a model line. One rule reads
// what a ticket already says (kind, lane, size) and what a maintenance
// launcher is, and returns a tool-neutral `LaunchHint`; each target turns the
// tier into its own model name, or ignores it.
//
// Wherever the board can form a bare verb + slug, the pipeline picks its own
// model per stage (icm-board `select-model.sh`): Define — what `new` starts —
// is the advisor, on the frontier tier; Build, Release and every lane are the
// executor. Verb pick-ups mirror that, so the board never recommends a
// different model from the one the stage asks for. A prompt body has no
// stage behind it (a legacy ticket, a triage stub with no valid lane), so it
// is sized by the stub alone.

import type { LaunchHint } from "./types"

type Effort = LaunchHint["effort"]
type Size = "S" | "M" | "L"

/** The whole rule, in one place — tune freely. */
export const HINT_RULES = {
  /** Bare verb + slug pick-ups: the tier is the pipeline's, the effort the
   * stub's. */
  verb: {
    newTier: "deep",
    executorTier: "balanced",
    sizeEffort: { S: "medium", M: "high", L: "xhigh" },
    laneEffort: { chore: "low", tweak: "medium", bug: "high" },
    fallbackEffort: "high",
  },
  /** Prompt-body pick-ups, where no verb can be formed. */
  prompt: {
    size: {
      S: { tier: "balanced", effort: "medium" },
      M: { tier: "deep", effort: "high" },
      L: { tier: "deep", effort: "xhigh" },
    },
    lane: {
      chore: { tier: "balanced", effort: "low" },
      tweak: { tier: "balanced", effort: "medium" },
      bug: { tier: "deep", effort: "high" },
    },
    fallback: { tier: "deep", effort: "high" },
  },
  maintenance: {
    triage: { tier: "balanced", effort: "medium" },
    sweep: { tier: "balanced", effort: "medium" },
    recut: { tier: "deep", effort: "high" },
    "estate-check": { tier: "deep", effort: "high" },
  },
} as const satisfies {
  verb: {
    newTier: LaunchHint["tier"]
    executorTier: LaunchHint["tier"]
    sizeEffort: Record<Size, Effort>
    laneEffort: Record<string, Effort>
    fallbackEffort: Effort
  }
  prompt: {
    size: Record<Size, LaunchHint>
    lane: Record<string, LaunchHint>
    fallback: LaunchHint
  }
  maintenance: Record<string, LaunchHint>
}

export type MaintenanceKind = keyof typeof HINT_RULES.maintenance

/** What the rule reads off a ticket — a structural slice of `Ticket`, so this
 * module never imports the board's data layer. */
export type HintSubject = {
  kind: "stub" | "legacy" | "run"
  /** "triage" for a one-off stub, the epic folder otherwise. */
  batch: string | null
  /** The ticket's header lines; `Lane` and `Size` are read from here. */
  meta: [string, string][]
  pickupKind: "verb" | "prompt" | null
}

/** The estate writes both `S/M/L` and `small/medium/large`, in any case. */
export function normaliseSize(raw: string | null | undefined): Size | null {
  const v = raw?.trim().toLowerCase()
  if (v === "s" || v === "small") return "S"
  if (v === "m" || v === "medium") return "M"
  if (v === "l" || v === "large") return "L"
  return null
}

function metaValue(meta: [string, string][], key: string): string | null {
  return meta.find(([k]) => k === key)?.[1] ?? null
}

/** Null when there is nothing to launch. */
export function hintForTicket(ticket: HintSubject): LaunchHint | null {
  if (ticket.pickupKind === null) return null
  const size = normaliseSize(metaValue(ticket.meta, "Size"))
  const lane = metaValue(ticket.meta, "Lane")?.trim().toLowerCase() ?? null
  const isTriage = ticket.kind === "stub" && ticket.batch === "triage"
  const isEpicStub = ticket.kind === "stub" && !isTriage

  if (ticket.pickupKind === "verb") {
    const v = HINT_RULES.verb
    // `/pipeline new <epic>/<slug>` opens Define; everything else a verb can
    // be — a lane, a build, a release — is the executor.
    const tier = isEpicStub ? v.newTier : v.executorTier
    let effort: Effort = v.fallbackEffort
    if (isEpicStub && size) effort = v.sizeEffort[size]
    else if (isTriage && lane && lane in v.laneEffort) {
      effort = v.laneEffort[lane as keyof typeof v.laneEffort]
    }
    return { tier, effort }
  }

  const p = HINT_RULES.prompt
  if (isTriage && lane && lane in p.lane) return p.lane[lane as keyof typeof p.lane]
  if (isEpicStub && size) return p.size[size]
  return p.fallback
}

export function hintForMaintenance(kind: MaintenanceKind): LaunchHint {
  return HINT_RULES.maintenance[kind]
}
