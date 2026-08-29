"use client"

import { useState } from "react"
import { CreditCard, GitBranch } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@jamie-nisbet/ui"

import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStripeLink } from "@/components/client-stripe-link"

// The two pieces of plumbing behind a client — the repo their delivery work
// lives in, and the Stripe customer their invoices bill — reduced to what you
// actually do with them: glance, then jump.
//
// They used to be a whole section down the page ("Delivery & billing"), two
// rows plus a default branch plus a "Set up" sheet, for facts set once per
// customer and afterwards only ever read. Here they are two glyphs riding with
// the identity: lit and filled when connected, dimmed on a dashed outline when
// not. Tapping a lit one opens GitHub or Stripe; tapping a dim one opens the
// control that links it.
//
// They are also the only thing left that says a client is missing plumbing.
// The conversion walkthrough and its warning badges are gone — status is
// conversion — so an unlit glyph is the quiet reminder, and it never blocks,
// nags or walks anyone through anything.

function Glyph({
  icon,
  connected,
  label,
  href,
  className,
  ...props
}: {
  icon: React.ReactNode
  /** Linked: filled and tinted. Not linked: dim, on a dashed outline. */
  connected: boolean
  /** The whole accessible name — what it is and what tapping does. */
  label: string
  /** Present when connected; the glyph becomes the jump to it. */
  href?: string
} & React.ComponentProps<"button">) {
  const Comp = (href != null ? "a" : "button") as React.ElementType

  return (
    <Comp
      // A 40px disc inside the 44px touch floor: it reads as a status light
      // beside the badges, and still takes a thumb.
      className={cn(
        "flex min-h-app-touch min-w-app-touch items-center justify-center",
        className
      )}
      aria-label={label}
      title={label}
      {...(href != null
        ? { href, target: "_blank", rel: "noreferrer" }
        : { type: "button" as const })}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition-colors spring-press [&>svg]:size-5",
          connected
            ? // The same soft tint an available action circle wears — this
              // one is live, and pressing it deepens rather than shrinks.
              "bg-app-fill text-app-fill-label active:bg-app-fill-press"
            : // An empty slot, said without relying on colour alone: sunken,
              // grey, and ringed the way an unfilled field is.
              "border border-dashed border-app-separator bg-app-track text-app-label-3 active:bg-app-press"
        )}
      >
        {icon}
      </span>
    </Comp>
  )
}

export function LeadLinks({
  id,
  name,
  githubRepo,
  githubDefaultBranch,
  githubConfigured,
  suggestedRepoName,
  stripeCustomerId,
}: {
  id: string
  name: string
  githubRepo: string | null
  githubDefaultBranch: string | null
  githubConfigured: boolean
  suggestedRepoName: string
  stripeCustomerId: string | null
}) {
  const [repoOpen, setRepoOpen] = useState(false)
  const [stripeOpen, setStripeOpen] = useState(false)

  return (
    <div className="-my-0.5 flex items-center">
      {githubRepo ? (
        <Glyph
          icon={<GitBranch />}
          connected
          label={`Delivery repo ${githubRepo} — open on GitHub`}
          href={`https://github.com/${githubRepo}`}
        />
      ) : (
        <Sheet open={repoOpen} onOpenChange={setRepoOpen}>
          <SheetTrigger asChild>
            <Glyph
              icon={<GitBranch />}
              connected={false}
              label="No delivery repo — connect one"
            />
          </SheetTrigger>
          {/* Two forms' worth of controls and a keyboard: the medium detent
              opens on the pair of them and drags to full height. */}
          <SheetContent detents={["medium", "large"]}>
            <SheetHeader>
              <SheetTitle>Delivery repo</SheetTitle>
              <SheetDescription>
                Where {name}&apos;s work lives. Without one they are invisible
                on the tickets board.
              </SheetDescription>
            </SheetHeader>
            <ClientRepoLink
              id={id}
              githubRepo={githubRepo}
              githubDefaultBranch={githubDefaultBranch}
              configured={githubConfigured}
              suggestedName={suggestedRepoName}
              expanded
            />
          </SheetContent>
        </Sheet>
      )}

      {stripeCustomerId ? (
        <Glyph
          icon={<CreditCard />}
          connected
          label={`Stripe customer ${stripeCustomerId} — open in Stripe`}
          href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
        />
      ) : (
        <Sheet open={stripeOpen} onOpenChange={setStripeOpen}>
          <SheetTrigger asChild>
            <Glyph
              icon={<CreditCard />}
              connected={false}
              label="No Stripe customer — link one"
            />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Stripe customer</SheetTitle>
              <SheetDescription>
                Who {name} is in Stripe. The first invoice links them anyway —
                this does it ahead of time.
              </SheetDescription>
            </SheetHeader>
            <ClientStripeLink id={id} stripeCustomerId={stripeCustomerId} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
