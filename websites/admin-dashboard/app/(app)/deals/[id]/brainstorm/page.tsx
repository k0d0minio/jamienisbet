import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDeal, listWorkshopMessages } from "@jamie-nisbet/services"

import { BrainstormChat } from "@/components/brainstorm-chat"
import { DealPageHeader } from "@/components/deal-page-header"
import { DocumentGenerator } from "@/components/document-generator"
import { getDealStage } from "@/lib/deal-stages"

export const metadata: Metadata = { title: "Brainstorm & pitch" }
export const dynamic = "force-dynamic"

const stage = getDealStage("brainstorm")!

export default async function BrainstormStagePage({
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
        title={`${stage.step} · ${stage.title}`}
        description={stage.blurb}
      />

      <BrainstormChat
        dealId={deal.id}
        initialMessages={brainstorm.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
      />

      <DocumentGenerator
        dealId={deal.id}
        kind="triage"
        title="Worth taking on?"
        blurb="Score the fit before you invest more time — the go/no-go rubric applied to this lead, ending with an honest note you can share even on a redirect."
        cta="Assess the fit"
        notePlaceholder="Optional: budget signals, timeline pressure, anything the rubric should weigh"
      />
    </div>
  )
}
