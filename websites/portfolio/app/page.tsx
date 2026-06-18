import { Hero } from "@/components/sections/hero"
import { Services } from "@/components/sections/services"
import { SelectedWork } from "@/components/sections/selected-work"
import { About } from "@/components/sections/about"
import { ContactSection } from "@/components/sections/contact-section"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <SelectedWork />
      <About />
      <ContactSection />
    </>
  )
}
