import { Hero } from "@/components/sections/hero"
import { HowItWorks } from "@/components/sections/how-it-works"
import { WhatYouSell } from "@/components/sections/what-you-sell"
import { SalesKit } from "@/components/sections/sales-kit"
import { Faq } from "@/components/sections/faq"
import { ReferSection } from "@/components/sections/refer-section"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  // Sellers share links like /?ref=THEIR-CODE — prefill the form so the
  // referral code (the payout key) is captured without them retyping it.
  const { ref } = await searchParams
  const defaultReferralCode = (Array.isArray(ref) ? ref[0] : ref)?.trim()

  return (
    <>
      <Hero />
      <HowItWorks />
      <WhatYouSell />
      <SalesKit referralCode={defaultReferralCode} />
      <Faq />
      <ReferSection defaultReferralCode={defaultReferralCode} />
    </>
  )
}
