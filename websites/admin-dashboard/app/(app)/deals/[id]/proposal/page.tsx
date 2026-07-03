import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDeal } from "@jamie-nisbet/services"

import { DealPageHeader } from "@/components/deal-page-header"
import { ProposalBuilder } from "@/components/proposal-builder"
import { getDealStage } from "@/lib/deal-stages"

export const metadata: Metadata = { title: "Proposal" }
export const dynamic = "force-dynamic"

const stage = getDealStage("proposal")!

export default async function ProposalStagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  return (
    <div className="flex flex-col gap-6">
      <DealPageHeader
        dealId={deal.id}
        dealTitle={deal.title}
        title={`${stage.step} · ${stage.title}`}
        description={stage.blurb}
      />

      <ProposalBuilder dealId={deal.id} />
    </div>
  )
}
