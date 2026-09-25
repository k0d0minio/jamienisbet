import { ExternalLink, FolderGit2 } from "lucide-react"

import { RecordBlock, RecordRow, RecordSection } from "@jamie-nisbet/ui"

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
    <RecordRow label={label} value={value} />
  )
}

export function LeadDealFolder({ folder }: { folder: DealFolder }) {
  const a = folder.agreement
  return (
    <RecordSection
      header="Deal folder"
      footer="Read live from icm-board on a one-minute clock. The rung in the head is the row's; the stage here is the folder's — when they disagree, one of them is wrong, and fixing it happens in whichever home holds that fact."
    >
      {folder.error ? (
        <RecordBlock className="text-desk-blocked">{folder.error}</RecordBlock>
      ) : (
        <>
          <Row
            label="Folder"
            value={
              <a
                href={folder.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-desk-meta text-desk-fg underline-offset-2 hover:underline"
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
                  <span className="font-mono text-desk-meta">{folder.engagement}</span>
                  {folder.stage ? (
                    <span className="font-mono text-desk-meta text-desk-fg-2">
                      {folder.stage.code} {folder.stage.name}
                    </span>
                  ) : null}
                  {folder.engagementEnded ? (
                    <span className="text-desk-fg-3">ended</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-desk-fg-3">none live</span>
              )
            }
          />
          {folder.repo ? (
            <Row label="Repo" value={<span className="font-mono text-desk-meta">{folder.repo}</span>} />
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
                  <span className="font-mono text-desk-meta">
                    {a.agreedMinor !== null ? formatMoney(a.agreedMinor, "eur") : "—"}
                    {a.recurringMinor ? ` + ${formatMoney(a.recurringMinor, "eur")}/mo` : ""}
                  </span>
                }
              />
              <Row
                label="Signed"
                value={
                  a.signed && a.signed !== "pending" ? (
                    <span className="font-mono text-desk-meta">{a.signed}</span>
                  ) : (
                    <span className="text-desk-fg-3">pending</span>
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
                      className="inline-flex items-center gap-1 text-desk-fg underline underline-offset-2"
                    >
                      the DOCX
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  }
                />
              ) : null}
            </>
          ) : folder.engagement ? (
            <RecordBlock>No 05-agreement.md in this engagement yet.</RecordBlock>
          ) : null}
        </>
      )}
    </RecordSection>
  )
}
