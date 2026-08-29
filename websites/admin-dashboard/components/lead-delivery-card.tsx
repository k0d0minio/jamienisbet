"use client"

import { useState } from "react"
import { CreditCard, Github, Settings2 } from "lucide-react"

import {
  GroupedRow,
  GroupedSection,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@jamie-nisbet/ui"

import { ClientRepoLink } from "@/components/client-repo-link"
import { ClientStripeLink } from "@/components/client-stripe-link"

// Where their work lives and how they get billed — plumbing you set once per
// customer, and then only ever read. So the group shows the two facts as rows
// that jump to GitHub and Stripe, and the forms that *change* them live behind
// one "Set up" row, in a sheet. Both controls are the same ones the Convert
// walkthrough composes; neither is duplicated here.
export function LeadDeliveryCard({
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
  const [open, setOpen] = useState(false)

  return (
    <GroupedSection
      header="Delivery & billing"
      footer="No repo means they are invisible on the tickets board; no Stripe customer means the first invoice stalls on plumbing."
    >
      {githubRepo ? (
        <GroupedRow
          icon={<Github />}
          label="Delivery repo"
          value={<span className="font-mono">{githubRepo}</span>}
          href={`https://github.com/${githubRepo}`}
          target="_blank"
          rel="noreferrer"
        />
      ) : (
        <GroupedRow
          icon={<Github />}
          label="Delivery repo"
          chevron={false}
          value="Not connected"
        />
      )}

      {githubRepo && githubDefaultBranch ? (
        <GroupedRow
          label="Default branch"
          chevron={false}
          value={<span className="font-mono">{githubDefaultBranch}</span>}
        />
      ) : null}

      {stripeCustomerId ? (
        <GroupedRow
          icon={<CreditCard />}
          label="Stripe customer"
          value={<span className="font-mono">{stripeCustomerId}</span>}
          href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
          target="_blank"
          rel="noreferrer"
        />
      ) : (
        <GroupedRow
          icon={<CreditCard />}
          label="Stripe customer"
          chevron={false}
          value="Not linked"
        />
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <GroupedRow
            icon={<Settings2 />}
            label={
              githubRepo && stripeCustomerId
                ? "Manage delivery & billing"
                : "Set up delivery & billing"
            }
          />
        </SheetTrigger>
        <SheetContent detents={["large"]}>
          <SheetHeader>
            <SheetTitle>Delivery & billing</SheetTitle>
            <SheetDescription>
              The repo {name}&apos;s work lives in, and their Stripe customer.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="text-app-footnote text-app-label-3">
                Delivery repo
              </h3>
              <ClientRepoLink
                id={id}
                githubRepo={githubRepo}
                githubDefaultBranch={githubDefaultBranch}
                configured={githubConfigured}
                suggestedName={suggestedRepoName}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-app-separator pt-4">
              <h3 className="text-app-footnote text-app-label-3">
                Stripe customer
              </h3>
              <ClientStripeLink id={id} stripeCustomerId={stripeCustomerId} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
