import { Badge, cn } from "@jamie-nisbet/ui"

import type { DealStage } from "@/lib/deals"

// Where the deal folder says the engagement stands — "03 quote", "05
// agreement" — read from icm-board, never written from here. It rides beside
// the deal badges on a list row and in the profile's Deal folder section; the
// code stays mono because it is an identifier, the name is the word.
export function DealStageChip({
  stage,
  className,
}: {
  stage: DealStage
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5", className)}
      title={`Deal folder stage: the highest artefact in the live engagement is ${stage.code}-${stage.name}`}
    >
      <span className="font-mono">{stage.code}</span>
      {stage.name}
    </Badge>
  )
}
