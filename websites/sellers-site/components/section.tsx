import * as React from "react"
import { cn, Eyebrow } from "@jamie-nisbet/ui"

const widths = {
  sm: "max-w-[var(--container-sm)]",
  md: "max-w-[var(--container-md)]",
  lg: "max-w-[var(--container-lg)]",
  xl: "max-w-[var(--container-xl)]",
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

export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-24", className)} {...props} />
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
    <div className={cn("flex max-w-[var(--container-md)] flex-col gap-4", className)}>
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
