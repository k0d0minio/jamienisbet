// The delivery seed — the three stage documents the dashboard commits into a
// client's external repo when a deal is won. The markdown under
// shared/templates/delivery/ is the Layer-3 source (edit there); this module
// only maps each file onto its destination path in the client repo.
//
// Read via the same repo-file mechanism as every other Layer-3 input, so on
// Vercel the files must be traced into the routes that seed (see
// outputFileTracingIncludes in the admin's next.config.ts).

import { readRepoFile } from "./repo"

/** Where a template lives here → where it lands in the client's repo. */
export const deliveryTemplateSpecs = [
  {
    source: "shared/templates/delivery/01_discovery.md",
    destination: "docs/icm/01_discovery.md",
  },
  {
    source: "shared/templates/delivery/02_build.md",
    destination: "docs/icm/02_build.md",
  },
  {
    source: "shared/templates/delivery/03_delivery.md",
    destination: "docs/icm/03_delivery.md",
  },
] as const

export type DeliveryFile = {
  /** Path to create in the client's repo. */
  path: string
  /** Full markdown content. */
  content: string
}

/** Load the delivery seed files. Throws (with a tracing hint) if a template
 * cannot be read — seeding half a skeleton is worse than failing loudly. */
export function loadDeliveryTemplates(): DeliveryFile[] {
  return deliveryTemplateSpecs.map((spec) => ({
    path: spec.destination,
    content: readRepoFile(spec.source),
  }))
}
