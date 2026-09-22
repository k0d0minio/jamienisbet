import { ExternalLink, FolderGit2, TriangleAlert } from "lucide-react"

import { GroupedBlock, GroupedRow, GroupedSection } from "@jamie-nisbet/ui"

import { DealStageChip } from "@/components/deal-stage-chip"
import type { DealFolder } from "@/lib/deals"
import { formatMoney } from "@/lib/money"

// What the deal folder says — read from icm-board, beside the row's own rung
// and figure, never merged into them (icm-board D24: state in Neon, documents
// in the folder, and the profile shows both so the one that is wrong is
// visible). A server component: it renders what `lib/deals.ts` read and holds
// no control that writes. The one action the folder invites — bringing the
// row's figures in line with the agreement — lives on the Deal card as a
// prefill, and Save there is still Jamie's.

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <GroupedRow label={label} chevron={false} value={value} />
  )
}

export function LeadDealFolder({
  folder,
  badge,
}: {
  folder: DealFolder
  /** The one line said when the rung and the folder cannot both be true
   *  (`dealBadge`), or null. */
  badge: string | null
}) {
  const a = folder.agreement
  return (
    <GroupedSection
      header="Deal folder"
      footer="Read live from icm-board on a one-minute clock. The rung above is the row's; the stage here is the folder's — when they disagree, one of them is wrong, and fixing it happens in whichever home holds that fact."
    >
      {folder.error ? (
        <GroupedBlock className="text-destructive">{folder.error}</GroupedBlock>
      ) : (
        <>
          {badge ? (
            <GroupedBlock className="flex items-start gap-2 text-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>{badge}</span>
            </GroupedBlock>
          ) : null}
          <Row
            label="Folder"
            value={
              <a
                href={folder.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-app-tint"
              >
                <FolderGit2 className="size-4" aria-hidden />
                {folder.slug}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            }
          />
          <Row
            label="Engagement"
            value={
              folder.engagement ? (
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono">{folder.engagement}</span>
                  {folder.stage ? <DealStageChip stage={folder.stage} /> : null}
                  {folder.engagementEnded ? (
                    <span className="text-app-label-3">ended</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-app-label-3">none live</span>
              )
            }
          />
          {folder.repo ? (
            <Row label="Repo" value={<span className="font-mono">{folder.repo}</span>} />
          ) : null}
          {folder.language ? <Row label="Language" value={folder.language} /> : null}
          {a ? (
            <>
              <Row
                label="Agreement"
                value={
                  <span>
                    {[a.tier, a.shape].filter(Boolean).join(" · ") || "05-agreement.md"}
                  </span>
                }
              />
              <Row
                label="Agreed"
                value={
                  <span className="font-mono">
                    {a.agreedMinor !== null ? formatMoney(a.agreedMinor, "eur") : "—"}
                    {a.recurringMinor ? ` + ${formatMoney(a.recurringMinor, "eur")}/mo` : ""}
                  </span>
                }
              />
              <Row
                label="Signed"
                value={
                  a.signed && a.signed !== "pending" ? (
                    <span className="font-mono">{a.signed}</span>
                  ) : (
                    <span className="text-app-label-3">pending</span>
                  )
                }
              />
              {a.drive ? (
                <Row
                  label="Drive"
                  value={
                    <a
                      href={a.drive}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-app-tint underline underline-offset-2"
                    >
                      the DOCX
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  }
                />
              ) : null}
            </>
          ) : folder.engagement ? (
            <GroupedBlock>No 05-agreement.md in this engagement yet.</GroupedBlock>
          ) : null}
        </>
      )}
    </GroupedSection>
  )
}
