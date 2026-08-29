"use client"

// One light tick, for the moments the screen commits something and the glass
// should answer: a swipe past its threshold (where the finger has already
// left and there is nothing to feel), and a control that changes a *state*
// rather than opening something — a status moved, a lead marked touched, work
// declared started, a record archived.
//
// Never on an ordinary navigation or an opening sheet: those already have a
// press state and a movement, and a phone that buzzes at everything is a phone
// you turn the haptics off on.
//
// Silent everywhere it isn't supported, which is all of iOS Safari — the
// gesture still works, it just doesn't answer.
export function hapticTick() {
  if (typeof navigator === "undefined") return
  // There is no "prefers-reduced-haptics", and someone who has asked for less
  // motion has asked for less of exactly this kind of flourish.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
  try {
    navigator.vibrate?.(10)
  } catch {
    // Blocked by policy (no user activation yet) — nothing to recover from.
  }
}
