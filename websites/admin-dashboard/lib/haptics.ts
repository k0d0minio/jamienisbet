"use client"

// One light tick, for the moments the screen commits something and the glass
// should answer: a swipe past its threshold (where the finger has already
// left and there is nothing to feel), and a control that **changes the
// record** rather than opening something — a status moved, a lead marked
// touched, work declared started, an edit saved, something created, something
// deleted or archived.
//
// It fires on the commit, not on the outcome: at the tap, before the round
// trip. The glass is answering your finger, and the server's answer is the
// screen's job (a row that moves, a toast, a sheet that closes).
//
// Never on an ordinary navigation, an opening sheet, a copy to the clipboard,
// or a re-read: those already have a press state and a movement, and a phone
// that buzzes at everything is a phone you turn the haptics off on.
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
