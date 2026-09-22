import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@jamie-nisbet/ui"
import { Container, Section, SectionHeading } from "@jamie-nisbet/app-shell"

import { IntakeForm } from "@/components/intake-form"
import { loadIntakeForm } from "@/lib/icm-board"
import { site } from "@/lib/site"

// The free look's front door (icm-board positioning.md § The three verbs:
// every project starts here). Eight questions off icm-board's
// `intake-diagnostic.md`, then a call, then one page — free. Every "Get a
// free look" on the site lands here; the contact form stays for everything
// that isn't a project.
//
// Static per locale with the questionnaire read on a one-minute revalidate —
// no `force-dynamic`, for the reasons `lib/icm-board.ts` gives. When the
// questionnaire can't be read (no token on this deployment, GitHub down) the
// page says so and offers the email address rather than an empty form.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "start" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/start`,
      languages: {
        en: "/en/start",
        pt: "/pt/start",
        fr: "/fr/start",
        "x-default": "/en/start",
      },
    },
  }
}

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("start")
  const snapshot = await loadIntakeForm()

  return (
    <Section>
      <Container className="flex max-w-3xl flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

        {snapshot ? (
          <IntakeForm snapshot={snapshot} />
        ) : (
          <Alert>
            <TriangleAlert />
            <AlertTitle>{t("unavailableTitle")}</AlertTitle>
            <AlertDescription>
              {t("unavailableBody")}{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {site.email}
              </a>
            </AlertDescription>
          </Alert>
        )}
      </Container>
    </Section>
  )
}
