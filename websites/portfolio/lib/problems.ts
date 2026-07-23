// The home page is organised around three plain-language problems a non-technical
// owner recognises, not the eight-item service catalogue (that lives on /tech).
// Each problem groups a few of the granular SERVICE_IDS: the problem card shows
// the plain framing, then links each covered service to the contact form so the
// exact, locale-invariant id still reaches biz.clients (the DB taxonomy is
// unchanged — see lib/services.ts and app/actions/contact.ts).
//
// Order is the display order in the Problems section. Titles/descriptions are
// copy in the "problems.items.<id>" message namespace; icons are structure and
// live in components/sections/problems.tsx.
import type { ServiceId } from "@/lib/services"

export const PROBLEM_IDS = ["busywork", "getFound", "custom"] as const

export type ProblemId = (typeof PROBLEM_IDS)[number]

// Which granular services each problem covers, and which one the card's primary
// CTA enquires about (`primary`). Every id here is a real ServiceId, so the
// contact form reflects a known title and the DB stores a stable value.
export const PROBLEMS: Record<
  ProblemId,
  { primary: ServiceId; covers: readonly ServiceId[] }
> = {
  busywork: { primary: "automation", covers: ["automation", "aiInfrastructure"] },
  getFound: { primary: "landingPages", covers: ["landingPages", "geo", "leadGen"] },
  custom: { primary: "software", covers: ["software", "projectManagement"] },
}
