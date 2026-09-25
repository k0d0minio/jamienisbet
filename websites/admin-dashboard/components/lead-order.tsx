"use client"

import { useEffect } from "react"

import { writeLeadOrder } from "@/lib/lead-order"

// Mounted once on the leads list: records the ids it rendered, in order, so a
// profile opened from it can step to the next and previous lead with j / k
// (lib/lead-order.ts). Renders nothing. The ids arrive joined into one key so
// a re-render with the same list writes nothing new.
export function LeadOrderRecorder({ ids }: { ids: readonly string[] }) {
  const joined = ids.join(",")
  useEffect(() => {
    writeLeadOrder(joined === "" ? [] : joined.split(","))
  }, [joined])
  return null
}
