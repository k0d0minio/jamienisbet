"use client"

// One light tick, for the gestures that commit something without a button being
// pressed — a swipe past its threshold, where the finger has left the glass and
// there's nothing to feel. Never on an ordinary tap: the tap already has the
// press state, and a phone that buzzes at everything is a phone you turn the
// haptics off on.
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
