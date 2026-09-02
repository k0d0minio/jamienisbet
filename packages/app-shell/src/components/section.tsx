import * as React from "react"
import { cn, Eyebrow, Reveal } from "@jamie-nisbet/ui"

const widths = {
  sm: "max-w-[var(--layout-sm)]",
  md: "max-w-[var(--layout-md)]",
  lg: "max-w-[var(--layout-lg)]",
  xl: "max-w-[var(--layout-xl)]",
} as const

export function Container({
  size = "lg",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof widths }) {
  return (
    <div
      className={cn("mx-auto w-full px-5 sm:px-8", widths[size], className)}
      {...props}
    />
  )
}

// A page section reveals itself once as it scrolls into view — the marketing
// tier's one entrance (a fade and an 8px rise on the brand clock), applied at
// the section so every site gets it from one place and no page has to opt in.
// `Reveal` is a client component; the section's contents stay server-rendered
// and are passed through as children.
export function Section({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration">) {
  return (
    <Reveal as="section" className={cn("py-16 sm:py-24", className)} {...props}>
      {children}
    </Reveal>
  )
}

export function SectionHeading({
  eyebrow,
  index,
  title,
  intro,
  className,
}: {
  eyebrow?: React.ReactNode
  index?: React.ReactNode
  title: React.ReactNode
  intro?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex max-w-[var(--layout-md)] flex-col gap-4", className)}>
      {eyebrow && (
        <Eyebrow rule index={index}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {intro && (
        <p className="text-lg text-pretty text-muted-foreground">{intro}</p>
      )}
    </div>
  )
}
