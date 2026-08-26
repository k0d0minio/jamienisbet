import { setRequestLocale } from "next-intl/server"

import { Hero } from "@/components/sections/hero"
import { Problems } from "@/components/sections/problems"
import { SelectedWork } from "@/components/sections/selected-work"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Faq } from "@/components/sections/faq"
import { About } from "@/components/sections/about"
import { ContactSection } from "@/components/sections/contact-section"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Hero />
      <Problems />
      <SelectedWork />
      <HowItWorks />
      <Faq />
      <About />
      <ContactSection />
    </>
  )
}
