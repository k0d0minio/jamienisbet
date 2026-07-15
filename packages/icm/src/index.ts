// Barrel — the one import surface for consumers: `@jamie-nisbet/icm`.
// Server-only: this package reads repo files with node:fs. Never import it
// from a client component.
export { findRepoRoot, readRepoFile, tryReadRepoFile } from "./repo"
export {
  documentKinds,
  isDocumentKind,
  stageSpecs,
  type DocumentKind,
  type ModelTier,
  type StageSpec,
} from "./stages"
export { modelFor, modelForTier, researchModel } from "./models"
export {
  assembleOutreachContext,
  assembleStageContext,
  type StageContext,
} from "./context"
export {
  isTouchKind,
  outreachSpecs,
  touchKinds,
  type OutreachSpec,
  type TouchKind,
} from "./outreach"
export {
  deliveryTemplateSpecs,
  loadDeliveryTemplates,
  type DeliveryFile,
} from "./delivery"
