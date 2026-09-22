import { cache } from "react"
import type { Metadata } from "next"
import { CircleCheck, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@jamie-nisbet/ui"
import { getFormLink } from "@jamie-nisbet/services"

import { CustomerForm } from "@/components/customer-form"
import { site } from "@/lib/site"

// The customer-facing questionnaire. The token in the URL *is* the credential —
// a v4 uuid, unguessable, and the only thing standing between the visitor and
// this form, which is the point: no account, no password, one link.
//
// Everything rendered here comes from the link's `form_snapshot`. This page
// never reads the questionnaire markdown, so a question reworded in git after the link
// was sent changes nothing about what this person is looking at.

export const dynamic = "force-dynamic"

// The metadata pass and the render pass both need the link; `cache` makes that
// one query per request instead of two.
const loadLink = cache(getFormLink)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const link = await loadLink(token)
  return {
    title: link ? `${link.formSnapshot.title} — ${site.name}` : site.name,
    // Belt and braces with the layout's robots directive — a page-level
    // `noindex` survives a crawler that reached the URL from a forwarded email.
    robots: { index: false, follow: false },
  }
}

function DeadEnd({
  variant,
  title,
  children,
}: {
  variant: "info" | "default"
  title: string
  children: React.ReactNode
}) {
  return (
    <Alert variant={variant}>
      {variant === "info" ? <CircleCheck /> : <TriangleAlert />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export default async function CustomerFormPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const link = await loadLink(token)

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      {/* Three states, and only one of them is a form. An unknown token and a
          spent one are both dead ends, but they are not the same news: one is
          "check the link", the other is "you're already done". */}
      {!link ? (
        <DeadEnd variant="default" title="This link isn't valid.">
          It may have been mistyped, or the form may have been withdrawn. If you
          were expecting a questionnaire, reply to the email it came in — or
          write to{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {site.email}
          </a>
          .
        </DeadEnd>
      ) : link.completedAt !== null ? (
        <DeadEnd variant="info" title="You've already sent this one in.">
          Your answers are with Jamie — there&apos;s nothing more to do here.
          He&apos;ll be in touch shortly.
        </DeadEnd>
      ) : (
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {link.formSnapshot.title}
            </h1>
            {link.formSnapshot.intro ? (
              <p className="text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                {link.formSnapshot.intro}
              </p>
            ) : null}
          </header>

          <CustomerForm token={link.id} snapshot={link.formSnapshot} />
        </div>
      )}
    </div>
  )
}
