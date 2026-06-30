import type { ComponentType } from "react"
import { getTranslations } from "next-intl/server"
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@jamie-nisbet/ui"
import {
  ArrowRight,
  ClipboardList,
  Code2,
  Compass,
  LayoutTemplate,
  Megaphone,
  Search,
  Server,
  Workflow,
} from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Container, Section, SectionHeading } from "@/components/section"
import { SERVICE_IDS, type ServiceId } from "@/lib/services"

// Icon per service is structure (locale-invariant); titles/descriptions/examples
// are copy and live in the "services.items.<id>" message namespace.
const icons: Record<ServiceId, ComponentType<{ className?: string }>> = {
  geo: Search,
  landingPages: LayoutTemplate,
  automation: Workflow,
  aiInfrastructure: Server,
  aiConsultancy: Compass,
  projectManagement: ClipboardList,
  software: Code2,
  leadGen: Megaphone,
}

export async function Services() {
  const t = await getTranslations("services")

  return (
    <Section className="border-b border-border">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow={t("eyebrow")}
          index="01"
          title={t("title")}
          intro={t("intro")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_IDS.map((id) => {
            const Icon = icons[id]
            return (
              <Card key={id} className="gap-4">
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">
                    {t(`items.${id}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <p>{t(`items.${id}.description`)}</p>
                  <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">
                      {t("exampleLabel")}
                    </span>{" "}
                    {t(`items.${id}.example`)}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    {/* Carries the service id to the contact form (hidden field
                        + visible reflection) so the email says which one. */}
                    <Link href={{ pathname: "/", query: { service: id }, hash: "contact" }}>
                      {t("cta")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
