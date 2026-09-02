"use client"

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { cn } from "../../lib/utils"

// Reveal — the marketing tier's one entrance: a fade and an 8px rise, quick
// and ease-out on the brand clock (260ms, cubic-bezier(0.2,0,0,1)), played
// once as the element scrolls into view. It is a transition, not a show — the
// brand's motion rules (BRAND.md § Motion) allow exactly this shape and
// nothing bouncier, and the distance is deliberately small enough to be felt
// rather than watched.
//
// Three pieces:
//
//   <Reveal>                 one block, on its own
//   <RevealGroup>            a parent that staggers its <RevealItem> children
//   <RevealItem>             a child of a group
//
// `mount` plays on mount rather than on scroll — for the hero, which is
// already in view when the page lands. Under reduced motion every piece
// renders its children still and visible; nothing waits on a scroll that the
// reader asked not to be animated.
//
// The initial (hidden) state is rendered into the server HTML by motion, so
// nothing flashes visible and then away at hydration.

const EASE_OUT = [0.2, 0, 0, 1] as const
const DISTANCE = 8
const DURATION = 0.26
const STAGGER = 0.08
// Fire a little before the element's top clears the fold, so a section is
// already settling by the time the eye reaches it.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const

const item: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE_OUT } },
}

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
}

type Tag = "div" | "section" | "article" | "li" | "ul" | "ol" | "span" | "p" | "h1" | "h2" | "h3" | "header"

// The handlers motion redefines with its own signatures — omitted so a plain
// React prop set can be spread onto a motion element without a type clash.
type PlainProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>

type RevealProps = PlainProps & {
  /** The element to render. */
  as?: Tag
  /** Play on mount instead of when scrolled into view. */
  mount?: boolean
  /** Seconds to hold before playing. */
  delay?: number
  children?: React.ReactNode
}

function Reveal({ as = "div", mount = false, delay = 0, className, children, ...props }: RevealProps) {
  const reduced = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  if (reduced) {
    // Typed as a div so the plain prop set spreads without a per-tag clash.
    const Plain = as as "div"
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    )
  }

  return (
    <Comp
      className={cn(className)}
      initial={{ opacity: 0, y: DISTANCE }}
      {...(mount ? { animate: { opacity: 1, y: 0 } } : { whileInView: { opacity: 1, y: 0 }, viewport: VIEWPORT })}
      transition={{ duration: DURATION, ease: EASE_OUT, delay }}
      {...(props as object)}
    >
      {children}
    </Comp>
  )
}

function RevealGroup({ as = "div", mount = false, delay = 0, className, children, ...props }: RevealProps) {
  const reduced = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  if (reduced) {
    // Typed as a div so the plain prop set spreads without a per-tag clash.
    const Plain = as as "div"
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    )
  }

  return (
    <Comp
      className={cn(className)}
      variants={group}
      initial="hidden"
      {...(mount ? { animate: "show" } : { whileInView: "show", viewport: VIEWPORT })}
      transition={{ delayChildren: delay }}
      {...(props as object)}
    >
      {children}
    </Comp>
  )
}

function RevealItem({ as = "div", className, children, ...props }: Omit<RevealProps, "mount" | "delay">) {
  const reduced = useReducedMotion()
  const Comp = motion[as] as typeof motion.div

  if (reduced) {
    // Typed as a div so the plain prop set spreads without a per-tag clash.
    const Plain = as as "div"
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    )
  }

  return (
    <Comp className={cn(className)} variants={item} {...(props as object)}>
      {children}
    </Comp>
  )
}

export { Reveal, RevealGroup, RevealItem }
