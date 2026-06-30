"use client"

import { useTranslations } from "next-intl"
import { Button } from "@jamie-nisbet/ui"
import { Printer } from "lucide-react"

// Opens the browser print dialog so a prospect (or seller) can save the pitch as
// a one-page PDF. Hidden in the printed output itself.
export function PrintButton() {
  const t = useTranslations()

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer />
      {t("print")}
    </Button>
  )
}
