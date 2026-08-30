import "server-only"

// The dashboard's one line to a language model.
//
// It is a re-export, and it was not always: sequence 5 wrote the model ids here
// because a screen was the only caller. Sequence 7 added a second — the
// `leads-enrich` batch script, which lives in `packages/services/scripts/` and
// cannot import out of an app — and a pool graded by one model from a terminal
// and another from a sheet would be tiered two ways. So the ids moved down to
// `@jamie-nisbet/services` (`src/ai.ts`), beside the prompts they belong to,
// and this file stays as the app's door to them.
//
// It keeps `server-only` on that door, which is the whole reason it is still a
// file. `isGatewayConfigured` reads `process.env`, and a client component that
// imported it would ship a build-time `false` into the browser and quietly
// disable a working feature.
//
// Nothing here sends anything to anybody. The Gateway returns text; a human
// reads it, edits it, and sends it from their own mailbox. See the estate's
// standing rule, and `.icm/docs/lia-cold-outreach.md` § 6 for the line this
// must not cross.

export {
  DRAFT_MAX_OUTPUT_TOKENS,
  DRAFT_MODEL_EN,
  DRAFT_MODEL_PT,
  ENRICH_MAX_OUTPUT_TOKENS,
  ENRICH_MODEL,
  draftModelFor,
  isGatewayConfigured,
} from "@jamie-nisbet/services"
