import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDeal, listWorkshopMessages } from "@jamie-nisbet/services"

import { DealDetailsForm } from "@/components/deal-details-form"
import { DealPageHeader } from "@/components/deal-page-header"
import { formatDateTime } from "@/lib/format"

export const metadata: Metadata = { title: "Details" }
export const dynamic = "force-dynamic"

export default async function DealDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getDeal(id)
  if (!deal) notFound()

  const brainstorm = await listWorkshopMessages(deal.id)

  return (
    <div className="flex flex-col gap-6">
      <DealPageHeader
        dealId={deal.id}
        dealTitle={deal.title}
        title="Details"
        description="The deal facts — the value follows the proposal's payment total."
      />

      <DealDetailsForm
        id={deal.id}
        title={deal.title}
        valueMinor={deal.valueMinor}
      />
      <p className="text-xs text-muted-foreground">
        Created {formatDateTime(deal.createdAt)} · Brainstorm messages:{" "}
        {brainstorm.length}
      </p>
    </div>
  )
}
