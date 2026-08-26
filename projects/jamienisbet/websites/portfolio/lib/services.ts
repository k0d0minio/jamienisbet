// The services offered, as locale-invariant ids. Order is the display order in
// the Services section. Titles, descriptions, and example cases are copy and
// live in the "services.items.<id>" message namespace; the icon for each id is
// structure and lives in components/sections/services.tsx.
//
// Shared by three places so they never drift: the Services section renders a
// card + CTA per id, the contact form reflects the picked id back to the
// visitor, and the contact server action looks the id's title up for the email.
export const SERVICE_IDS = [
  "geo",
  "landingPages",
  "automation",
  "aiInfrastructure",
  "aiConsultancy",
  "projectManagement",
  "software",
  "leadGen",
] as const

export type ServiceId = (typeof SERVICE_IDS)[number]

// The "service" value reaches us from a URL query param (Services CTA) and a
// hidden form field, so it is untrusted — only accept a known id.
export function isServiceId(value: string | null | undefined): value is ServiceId {
  return value != null && (SERVICE_IDS as readonly string[]).includes(value)
}
