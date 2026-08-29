// @jamie-nisbet/ui — barrel. Import primitives from the package root:
//   import { Button, Card, CardHeader } from "@jamie-nisbet/ui"
// and link the theme once at the app root:
//   import "@jamie-nisbet/ui/styles.css"

export { cn } from "./lib/utils"
export { useKeyboardInset } from "./lib/use-keyboard-inset"

// shadcn/ui primitives (themed with the brand tokens)
export * from "./components/ui/alert"
export * from "./components/ui/avatar"
export * from "./components/ui/badge"
export * from "./components/ui/button"
export * from "./components/ui/card"
export * from "./components/ui/checkbox"
export * from "./components/ui/dialog"
export * from "./components/ui/input"
export * from "./components/ui/label"
export * from "./components/ui/pending-button"
export * from "./components/ui/select"
export * from "./components/ui/sheet"
export * from "./components/ui/skeleton"
export * from "./components/ui/spinner"
export * from "./components/ui/switch"
export * from "./components/ui/tabs"
export * from "./components/ui/textarea"
export * from "./components/ui/toast"

// glanceable data-viz primitives (inline SVG, no chart library)
export * from "./components/ui/delta"
export * from "./components/ui/meter"
export * from "./components/ui/sparkline"
export * from "./components/ui/stat"

// app tier — opt-in, for operated surfaces only (the admin PWA). These
// need "@jamie-nisbet/ui/app.css" on top of styles.css; the marketing
// sites import neither the stylesheet nor these components.
export * from "./components/app/action-circle"
export * from "./components/app/collapsing-header"
export * from "./components/app/grouped-list"
export * from "./components/app/identity-header"
export * from "./components/app/large-title-header"
export * from "./components/app/material"
export * from "./components/app/monogram"

// brand-only primitives
export * from "./components/brand/eyebrow"
export * from "./components/brand/icon-button"
export * from "./components/brand/logo"
