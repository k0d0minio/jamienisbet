import { setRequestLocale } from "next-intl/server"

import { Hero } from "@/components/sections/hero"
import { Services } from "@/components/sections/services"
import { Outcomes } from "@/components/sections/outcomes"
import { SelectedWork } from "@/components/sections/selected-work"
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
      <Services />
      <Outcomes />
      <SelectedWork />
      <About />
      <ContactSection />
    </>
  )
}
