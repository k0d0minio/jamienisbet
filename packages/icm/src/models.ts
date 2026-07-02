// Model policy — the code mirror of _config/conventions/model-and-scaling.md:
// heavy reasoning (Opus-class) for negotiation strategy and triage assessment,
// cheaper/faster tiers for formatting and mechanical work. Model ids are
// Vercel AI Gateway slugs ("creator/model"), overridable per tier via env so
// models can be swapped without a code change.

import { stageSpecs, type DocumentKind, type ModelTier } from "./stages"

const DEFAULT_MODELS: Record<ModelTier, string> = {
  heavy: "anthropic/claude-opus-4.5",
  standard: "anthropic/claude-sonnet-4.5",
  fast: "anthropic/claude-haiku-4.5",
}

const TIER_ENV: Record<ModelTier, string> = {
  heavy: "AI_MODEL_HEAVY",
  standard: "AI_MODEL_STANDARD",
  fast: "AI_MODEL_FAST",
}

export function modelForTier(tier: ModelTier): string {
  return process.env[TIER_ENV[tier]] || DEFAULT_MODELS[tier]
}

export function modelFor(kind: DocumentKind): string {
  return modelForTier(stageSpecs[kind].modelTier)
}
