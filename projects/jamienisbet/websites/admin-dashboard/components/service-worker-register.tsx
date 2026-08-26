"use client"

import { useEffect } from "react"

// Registers the PWA service worker (public/sw.js) once on the client. Kept as a
// tiny client island so the rest of the app stays server-rendered.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is best-effort; the app works fine without it.
      })
    }
    // Wait for load so the SW never competes with first-render fetches.
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
