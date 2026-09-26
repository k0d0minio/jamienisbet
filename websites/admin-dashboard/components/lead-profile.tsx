"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { DeskTabs, cn, deskTabId, deskTabPanelId } from "@jamie-nisbet/ui"

import { PhoneChrome } from "@/components/phone-chrome"
import { ViewTransitionLink } from "@/components/view-transition-link"
import {
  leadPosition,
  markLeadOrigin,
  parseLeadOrder,
  readLeadOrderSnapshot,
  readLeadOriginSnapshot,
} from "@/lib/lead-order"
import { DEFAULT_LEAD_TAB, LEAD_TABS, type LeadTabKey } from "@/lib/lead-tabs"

// A lead's profile on the desk tier (D-20): the head across the top, then at
// the desk two columns — the record on the left, the activity on the right,
// each scrolling on its own — and below `lg` one column, next step first.
//
// The page is a server component and builds every part; this is the client
// frame that holds what the parts share: which tab is open (kept in `?tab=`),
// the touch-log and opt-out sheets the action bar opens from the head while
// they live further down the page, and the keys — j / k to the neighbouring
// lead in the list's order (lib/lead-order.ts), L to log a touch, T to mark
// them touched today.
//
// Two columns start at `lg`, not at the rail's `md` (D-25): 712px of content
// is too narrow for a 420px record beside a usable timeline, so an iPad in
// portrait gets the rail and the stacked page.

type LeadProfileContextValue = {
  tab: LeadTabKey
  /** Switch the right column; `reveal` also scrolls the tabs into view — the
   *  phone, where they sit below the record. */
  showTab: (tab: LeadTabKey, reveal?: boolean) => void
  logOpen: boolean
  setLogOpen: (open: boolean) => void
  optOutOpen: boolean
  setOptOutOpen: (open: boolean) => void
}

const LeadProfileContext = createContext<LeadProfileContextValue | null>(null)

/** The profile's shared state, or null outside a profile. */
export function useLeadProfile(): LeadProfileContextValue | null {
  return useContext(LeadProfileContext)
}

/** A key hint inside a button — shown where there is a keyboard to press it
 *  with, never under a thumb. */
export function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="hidden font-mono text-desk-micro font-normal opacity-70 pointer-fine:inline"
    >
      {children}
    </span>
  )
}

/** A control the keyboard can press: the element carrying
 *  `data-lead-shortcut="<key>"` is clicked when that key is pressed. */
export const SHORTCUT_ATTR = "data-lead-shortcut"

/** Whether a key press belongs to something else: typing, a modifier, an open
 *  sheet, dialog or menu (the palette included). */
function keyIsTaken(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true
  if (event.metaKey || event.ctrlKey || event.altKey) return true
  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']"))
  ) {
    return true
  }
  return (
    document.querySelector(
      "[role='dialog'], [role='alertdialog'], [role='menu'], [role='listbox']"
    ) !== null
  )
}

/** The stored order changes only on the list, never under an open profile. */
function subscribeToNothing(): () => void {
  return () => {}
}

function tabHref(id: string, tab: LeadTabKey): string {
  return tab === DEFAULT_LEAD_TAB ? `/leads/${id}` : `/leads/${id}?tab=${tab}`
}

export function LeadProfile({
  id,
  initialTab,
  formsCount,
  head,
  record,
  panels,
}: {
  id: string
  /** The tab `?tab=` asked for, read on the server so the first paint is it. */
  initialTab: LeadTabKey
  /** Shown beside the Forms tab. */
  formsCount: number
  /** Identity, figure and the action bar. */
  head: React.ReactNode
  /** The left column: next step, the record's sections, how they came in. */
  record: React.ReactNode
  panels: Record<LeadTabKey, React.ReactNode>
}) {
  const router = useRouter()
  const [tab, setTab] = useState<LeadTabKey>(initialTab)
  const [logOpen, setLogOpen] = useState(false)
  const [optOutOpen, setOptOutOpen] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  // The list's order is in session storage, so the server (and the first
  // hydrating render) has none: no position and no j / k until the browser's
  // snapshot is read. Nothing else writes it while a profile is open, so the
  // subscription has nothing to listen to.
  const storedOrder = useSyncExternalStore(
    subscribeToNothing,
    readLeadOrderSnapshot,
    () => null
  )
  const origin = useSyncExternalStore(
    subscribeToNothing,
    readLeadOriginSnapshot,
    () => null
  )
  // Only a profile the list (or a j / k step) opened is *in* that order; any
  // other way in has no neighbours to step to.
  const position = useMemo(
    () =>
      origin === id ? leadPosition(parseLeadOrder(storedOrder), id) : null,
    [storedOrder, origin, id]
  )

  const showTab = useCallback((next: LeadTabKey, reveal = false) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === DEFAULT_LEAD_TAB) url.searchParams.delete("tab")
    else url.searchParams.set("tab", next)
    // Never `history.state`: the App Router would take the call for its own
    // and stop syncing the URL (Learned rules, master-detail-shell).
    window.history.replaceState(null, "", url)
    if (reveal) {
      tabsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (keyIsTaken(event)) return
      const key = event.key.toLowerCase()
      if (key === "j" || key === "k") {
        const target = key === "j" ? position?.next : position?.previous
        if (!target) return
        event.preventDefault()
        markLeadOrigin(target)
        router.push(tabHref(target, tab))
        return
      }
      if (key === "l" || key === "t") {
        const control = document.querySelector<HTMLElement>(
          `[${SHORTCUT_ATTR}="${key}"]`
        )
        if (!control || control.hasAttribute("disabled")) return
        event.preventDefault()
        control.click()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [position, router, tab])

  const context = useMemo(
    () => ({ tab, showTab, logOpen, setLogOpen, optOutOpen, setOptOutOpen }),
    [tab, showTab, logOpen, optOutOpen]
  )

  const idBase = `lead-${id}`

  return (
    <LeadProfileContext.Provider value={context}>
      {/* `lg:-mb-8` hands back the shell's bottom padding at the desk, where
          the columns scroll inside the window rather than the page. */}
      <div className="flex flex-col lg:-mb-8 lg:h-dvh">
        <div className="shrink-0 border-b border-desk-line bg-desk-surface px-4 pt-2 lg:px-6">
          <div className="flex min-h-desk-control items-center gap-3">
            <ViewTransitionLink
              href="/leads"
              className="-ml-1.5 inline-flex min-h-desk-control items-center gap-0.5 rounded-desk-control pr-2 pl-0.5 text-desk-ui text-desk-fg-3 transition-colors duration-100 hover:bg-desk-hover hover:text-desk-fg"
            >
              <ChevronLeft className="size-desk-icon" aria-hidden />
              Leads
            </ViewTransitionLink>
            {position ? (
              <span className="font-mono text-desk-meta text-desk-fg-3">
                {position.index} of {position.total}
                {/* The hint is for a keyboard; a phone has none to press. */}
                <span className="hidden pointer-fine:inline">
                  {" · j / k for next and previous"}
                </span>
              </span>
            ) : null}
            {/* The phone's chrome: the palette and the account menu live in the
                rail from `md`, and in the title bar every other screen has. */}
            <div className="ml-auto">
              <PhoneChrome />
            </div>
          </div>
          {head}
        </div>

        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
          <div className="flex flex-col gap-6 border-desk-line bg-desk-surface px-4 py-4 lg:w-[26.25rem] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:px-6">
            {record}
          </div>

          <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
            <div
              ref={tabsRef}
              className="scroll-mt-2 border-t border-desk-line bg-desk-surface px-4 lg:border-t-0 lg:px-6"
            >
              <DeskTabs
                aria-label="Lead"
                idBase={idBase}
                value={tab}
                onValueChange={(next) => showTab(next)}
                tabs={LEAD_TABS.map((t) => ({
                  value: t.key,
                  label: t.label,
                  count: t.key === "forms" ? formsCount : undefined,
                }))}
              />
            </div>
            <div className="px-4 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-6">
              {LEAD_TABS.map((t) => (
                <div
                  key={t.key}
                  role="tabpanel"
                  id={deskTabPanelId(idBase, t.key)}
                  aria-labelledby={deskTabId(idBase, t.key)}
                  // Panels stay mounted: a sheet open in one keeps its state
                  // while another tab is looked at.
                  className={cn("max-w-3xl", t.key !== tab && "hidden")}
                >
                  {panels[t.key]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LeadProfileContext.Provider>
  )
}
