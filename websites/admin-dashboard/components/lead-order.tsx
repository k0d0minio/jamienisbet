"use client"

import { useEffect } from "react"

import { leadIdFromHref, markLeadOrigin, writeLeadOrder } from "@/lib/lead-order"

// Mounted once on the leads list: records the ids it rendered, in order, so a
// profile opened from it can step to the next and previous lead with j / k
// (lib/lead-order.ts) — and, while the list is on screen, which lead a click
// opens, so the profile knows it was reached *from* this order. Listening on
// the document rather than wiring each row keeps the list's own markup (and
// whatever table replaces it) untouched. Renders nothing. The ids arrive
// joined into one key so a re-render with the same list writes nothing new.
export function LeadOrderRecorder({ ids }: { ids: readonly string[] }) {
  const joined = ids.join(",")
  useEffect(() => {
    writeLeadOrder(joined === "" ? [] : joined.split(","))
  }, [joined])

  useEffect(() => {
    // Capture, so the origin is written before the link's own navigation.
    function onClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest("a[href]")
      if (!link) return
      const id = leadIdFromHref(link.getAttribute("href") ?? "")
      if (id) markLeadOrigin(id)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])
  return null
}
