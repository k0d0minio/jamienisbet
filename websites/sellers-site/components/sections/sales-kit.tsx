import { Fragment } from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
} from "@jamie-nisbet/ui"
import { getTranslations } from "next-intl/server"
import { ArrowRight, Check, Presentation } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Container, Section, SectionHeading } from "@/components/section"
import { FollowUps, PitchScripts } from "@/components/pitch-scripts"
import { site } from "@/lib/site"

// Render a note template, swapping {site}/{code} tokens for styled spans.
function interpolate(
  template: string,
  values: Record<string, React.ReactNode>
) {
  return template.split(/(\{site\}|\{code\})/g).map((part, i) => {
    const token = part.replace(/[{}]/g, "")
    return <Fragment key={i}>{token in values ? values[token] : part}</Fragment>
  })
}

type PitchScript = { key: string; channel: string; title: string; body: string }
type FollowUp = { key: string; when: string; context: string; body: string }
type Objection = { objection: string; answer: string }
type Package = {
  key: string
  name: string
  price: string
  blurb: string
  includes: string[]
  sellerNote: string
}
type EarningExample = { work: string; invoice: string; youEarn: string }

export async function SalesKit({ referralCode }: { referralCode?: string }) {
  const t = await getTranslations()
  const kit = await getTranslations("salesKit")
  const copyLabel = t.raw("copy") as { copy: string; copied: string }

  const pitchScripts = t.raw("pitchScripts") as PitchScript[]
  const followUps = t.raw("followUps") as FollowUp[]
  const objections = t.raw("objections") as Objection[]
  const packages = t.raw("packages") as Package[]
  const goodLeadSigns = t.raw("goodLeadSigns") as string[]
  const earningExamples = t.raw("earningExamples") as EarningExample[]

  // Open from /?ref=CODE and the seller's code carries through to the pitch page.
  const refQuery = referralCode
    ? `?ref=${encodeURIComponent(referralCode)}`
    : ""
  // The ready-to-send messages go to customers, so they link to the
  // client-facing site — never this seller-only one. Attribution stays with the
  // seller through the lead they log here, not the link they share.
  const shareUrl = site.mainSiteUrl
  const pitchHref = `/pitch${refQuery}`

  const siteLabel = (
    <span className="font-mono text-foreground">jamienisbet.com</span>
  )

  return (
    <Section id="kit" className="border-b border-border">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow={kit("eyebrow")}
          index="03"
          title={kit("title")}
          intro={kit("intro")}
        />

        {/* The customer pitch page — the one thing to send a prospect. */}
        <div className="flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Presentation className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold tracking-tight">
                {kit("pitchCard.title")}
              </h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {kit("pitchCard.body")}
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href={pitchHref}>
              {kit("pitchCard.cta")}
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {/* Ready-to-send openers */}
        <div className="flex flex-col gap-5">
          <Eyebrow>{kit("readyEyebrow")}</Eyebrow>
          <PitchScripts
            shareUrl={shareUrl}
            scripts={pitchScripts}
            copyLabel={copyLabel}
          />
          <p className="text-xs text-muted-foreground">
            {referralCode
              ? interpolate(kit.raw("readyNoteWithCode") as string, {
                  site: siteLabel,
                  code: (
                    <span className="font-mono text-foreground">
                      {referralCode}
                    </span>
                  ),
                })
              : interpolate(kit.raw("readyNote") as string, {
                  site: <span className="font-mono">jamienisbet.com</span>,
                })}
          </p>
        </div>

        {/* Follow-up sequence */}
        <div className="flex flex-col gap-5">
          <Eyebrow>{kit("followEyebrow")}</Eyebrow>
          <FollowUps
            shareUrl={shareUrl}
            steps={followUps}
            copyLabel={copyLabel}
          />
          <p className="text-xs text-muted-foreground">{kit("followNote")}</p>
        </div>

        {/* Objection handling */}
        <div className="flex flex-col gap-5">
          <Eyebrow>{kit("objectionsEyebrow")}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            {objections.map((item) => (
              <Card key={item.objection} className="gap-2">
                <CardHeader>
                  <CardTitle className="text-base">{item.objection}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.answer}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Packages & prices */}
        <div className="flex flex-col gap-5">
          <Eyebrow>{kit("packagesEyebrow")}</Eyebrow>
          <div className="grid gap-4 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.key} className="gap-4">
                <CardHeader className="gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <span className="shrink-0 font-mono text-2xs tracking-[0.12em] text-primary uppercase">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.blurb}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex flex-1 flex-col gap-2">
                    {pkg.includes.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <span className="text-foreground/90">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {pkg.sellerNote}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Good-lead checklist + earnings */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-5">
            <Eyebrow>{kit("leadsEyebrow")}</Eyebrow>
            <ul className="flex flex-col gap-4">
              {goodLeadSigns.map((sign) => (
                <li key={sign} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-foreground/90">{sign}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5">
            <Eyebrow>{kit("earningsEyebrow")}</Eyebrow>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">{kit("table.work")}</th>
                    <th className="px-4 py-3 font-medium">{kit("table.pays")}</th>
                    <th className="px-4 py-3 text-right font-medium">
                      {kit("table.earn")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {earningExamples.map((row) => (
                    <tr
                      key={row.work}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.work}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.invoice}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {row.youEarn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">{kit("earningsNote")}</p>
          </div>
        </div>
      </Container>
    </Section>
  )
}
