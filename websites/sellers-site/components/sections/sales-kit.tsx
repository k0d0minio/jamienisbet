import Link from "next/link"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Eyebrow,
} from "@jamie-nisbet/ui"
import { ArrowRight, Check, Presentation } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { FollowUps, PitchScripts } from "@/components/pitch-scripts"
import {
  earningExamples,
  goodLeadSigns,
  objections,
  packages,
  site,
} from "@/lib/site"

export function SalesKit({ referralCode }: { referralCode?: string }) {
  // Open from /?ref=CODE and the seller's code carries through to the pitch page.
  const refQuery = referralCode
    ? `?ref=${encodeURIComponent(referralCode)}`
    : ""
  // The ready-to-send messages go to customers, so they link to the
  // client-facing site — never this seller-only one. Attribution stays with the
  // seller through the lead they log here, not the link they share.
  const shareUrl = site.mainSiteUrl
  const pitchHref = `/pitch${refQuery}`

  return (
    <Section id="kit" className="border-b border-border">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Your seller kit"
          index="03"
          title="Everything you need to make the intro."
          intro="Copy a message, send it, log the lead. No pitch to memorise, no tech to explain — that part's on me."
        />

        {/* The customer pitch page — the one thing to send a prospect. */}
        <div className="flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Presentation className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold tracking-tight">
                The customer pitch page
              </h3>
              <p className="text-sm text-pretty text-muted-foreground">
                A clean page that sells the work, not the program — show it on
                your phone or send the link. It prints to a one-pager too.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href={pitchHref}>
              Open the pitch
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {/* Ready-to-send openers */}
        <div className="flex flex-col gap-5">
          <Eyebrow>Ready-to-send messages</Eyebrow>
          <PitchScripts shareUrl={shareUrl} />
          <p className="text-xs text-muted-foreground">
            {referralCode ? (
              <>
                Each message links to{" "}
                <span className="font-mono text-foreground">jamienisbet.com</span>{" "}
                — the page customers see. Log the lead below with your code{" "}
                <span className="font-mono text-foreground">{referralCode}</span>{" "}
                to keep the 10% yours.
              </>
            ) : (
              <>
                Each message links to{" "}
                <span className="font-mono">jamienisbet.com</span> — the page
                customers see. Log the lead below with your referral code to keep
                the 10% yours.
              </>
            )}
          </p>
        </div>

        {/* Follow-up sequence */}
        <div className="flex flex-col gap-5">
          <Eyebrow>Follow up — where most referrals close</Eyebrow>
          <FollowUps shareUrl={shareUrl} />
          <p className="text-xs text-muted-foreground">
            Three light touches, then stop. A warm “later” is worth more than a
            pushed “no”.
          </p>
        </div>

        {/* Objection handling */}
        <div className="flex flex-col gap-5">
          <Eyebrow>If they hesitate</Eyebrow>
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
          <Eyebrow>What you can quote — and what to hand me</Eyebrow>
          <div className="grid gap-4 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.name} className="gap-4">
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
            <Eyebrow>What makes a lead worth sending</Eyebrow>
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
            <Eyebrow>What your 10% looks like</Eyebrow>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">The work</th>
                    <th className="px-4 py-3 font-medium">Client pays</th>
                    <th className="px-4 py-3 text-right font-medium">You earn</th>
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
            <p className="text-xs text-muted-foreground">
              Examples only — your 10% is always 10% of what the client actually
              pays, settled once their payment lands.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  )
}
