import * as React from "react"

import { Button } from "../ui/button"

// Convenience wrapper for an icon-only Button. Defaults to the ghost variant
// and the square `icon` size, and requires an accessible label.
// (Idiomatic alternative: `<Button size="icon" aria-label="…">`.)
type IconButtonProps = React.ComponentProps<typeof Button> & {
  "aria-label": string
}

function IconButton({
  size = "icon",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return <Button data-slot="icon-button" size={size} variant={variant} {...props} />
}

export { IconButton }
