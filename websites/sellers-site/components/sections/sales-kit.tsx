import { Eyebrow } from "@jamie-nisbet/ui"
import { Check } from "lucide-react"

import { Container, Section, SectionHeading } from "@/components/section"
import { PitchScripts } from "@/components/pitch-scripts"
import { earningExamples, goodLeadSigns, site } from "@/lib/site"

export function SalesKit({ referralCode }: { referralCode?: string }) {
  // Open from /?ref=CODE and the seller's code is baked into every pitch link.
  const shareUrl = referralCode
    ? `${site.url}/?ref=${encodeURIComponent(referralCode)}`
    : site.url

  return (
    <Section id="kit" className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Your seller kit"
          index="03"
          title="Everything you need to make the intro."
          intro="Copy a message, send it, log the lead. No pitch to memorise, no tech to explain — that part's on me."
        />

        <div className="flex flex-col gap-5">
          <Eyebrow>Ready-to-send messages</Eyebrow>
          <PitchScripts shareUrl={shareUrl} />
          <p className="text-xs text-muted-foreground">
            {referralCode ? (
              <>
                Your code{" "}
                <span className="font-mono text-foreground">{referralCode}</span>{" "}
                is already baked into each link — so the 10% stays yours.
              </>
            ) : (
              <>
                Open this page from your own link (
                <span className="font-mono">
                  refer.jamienisbet.com/?ref=YOUR-CODE
                </span>
                ) and your code drops into every message automatically.
              </>
            )}
          </p>
        </div>

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
