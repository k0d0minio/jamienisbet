"use client"

import { useTheme } from "next-themes"
import { IconButton } from "@jamie-nisbet/ui"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle({ label }: { label: string }) {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <IconButton
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons render identically on server and client; the design system's
          `dark:` variant (keyed off [data-theme]) shows the right one via CSS,
          so there's no hydration flash and no setState-in-effect. */}
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </IconButton>
  )
}
