import { Hero } from "@/components/sections/hero"
import { Services } from "@/components/sections/services"
import { Outcomes } from "@/components/sections/outcomes"
import { SelectedWork } from "@/components/sections/selected-work"
import { About } from "@/components/sections/about"
import { ContactSection } from "@/components/sections/contact-section"

export default function HomePage() {
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
