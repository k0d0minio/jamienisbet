"use client"

import { Button } from "@jamie-nisbet/ui"
import { Printer } from "lucide-react"

// Opens the browser print dialog so a prospect (or seller) can save the pitch as
// a one-page PDF. Hidden in the printed output itself.
export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer />
      {label}
    </Button>
  )
}
