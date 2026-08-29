"use client"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"

import {
  GroupedRow,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@jamie-nisbet/ui"

import { ConvertFlow } from "@/components/convert-flow"

// Converting a lead is four acts — status, repo, deal terms, Stripe — and each
// skipped one breaks something downstream. It used to be a card wedged above
// the record; here it is one row in the state group that opens the same
// walkthrough in a sheet, so the profile leads with the person and the
// conversion is a thing you go and do.
export function LeadConvertRow({
  client,
  githubConfigured,
  suggestedRepoName,
  gaps,
}: {
  client: React.ComponentProps<typeof ConvertFlow>["client"]
  githubConfigured: boolean
  suggestedRepoName: string
  /** What a converted lead is still missing — the row's second line. */
  gaps: string[]
}) {
  const [open, setOpen] = useState(false)
  const isCustomer = client.status === "client"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <GroupedRow
          icon={<ArrowUpRight />}
          label={isCustomer ? "Finish conversion" : "Convert to client"}
          description={
            gaps.length > 0
              ? `Still open: ${gaps.join(", ")}`
              : "Status, repo, deal terms and Stripe in one pass"
          }
        />
      </SheetTrigger>
      <SheetContent detents={["large"]}>
        <SheetHeader>
          <SheetTitle>
            {isCustomer ? "Finish conversion" : "Convert"}
          </SheetTitle>
          <SheetDescription>
            {isCustomer
              ? "A client, but missing pieces — walk the remaining steps."
              : "Won the work? Walk status, repo, deal terms and Stripe in one pass."}
          </SheetDescription>
        </SheetHeader>
        <ConvertFlow
          client={client}
          githubConfigured={githubConfigured}
          suggestedRepoName={suggestedRepoName}
        />
      </SheetContent>
    </Sheet>
  )
}
