"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { Search } from "lucide-react"

import {
  CommandPalette as PaletteShell,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  StatusDot,
  cn,
} from "@jamie-nisbet/ui"

import {
  loadPaletteIndex,
  type PaletteEntry,
  type PaletteGroup,
  type PaletteIndex,
} from "@/app/(app)/palette-actions"

// The command palette (D-5): ⌘K — Ctrl+K off a Mac — from any screen, the
// rail's search button at the desk, the title bar's on a phone. It reaches any
// repo, ticket or lead and runs the few actions worth a keystroke; Money is
// deliberately not one of them (D-17 — it left the navigation, and the palette
// is navigation).
//
// The shell is the desk tier's `CommandPalette` (a dialog that traps focus,
// closes on Esc and hands focus back); this file owns what that leaves out —
// the shortcut, the index, the filtering and the highlight.
//
// The index is read when the palette opens, by one server action over the
// reads the screens already make (app/(app)/palette-actions.ts), and read
// again on every open, so it is never older than the moment you asked. The
// three "Go to" rows need no data and are there the instant it opens.

/** Rows a group shows before it stops — a palette is for jumping, not for
 *  browsing, and a narrower query is always one keystroke away. */
const GROUP_LIMIT = 8

const GROUPS: { key: PaletteGroup; heading: string }[] = [
  { key: "repos", heading: "Repos" },
  { key: "tickets", heading: "Tickets" },
  { key: "leads", heading: "Leads" },
  { key: "actions", heading: "Actions" },
]

const GO_TO: PaletteEntry[] = [
  { id: "go:work", group: "actions", label: "Go to Work", meta: null, href: "/" },
  { id: "go:inbox", group: "actions", label: "Go to Inbox", meta: null, href: "/inbox" },
  { id: "go:leads", group: "actions", label: "Go to Leads", meta: null, href: "/leads" },
]

// ---------------------------------------------------------------------------
// The modifier key, read once on the client. A server render cannot know the
// platform, so it says ⌘ and the first client render corrects it — through
// useSyncExternalStore, which is what keeps that correction from being a
// hydration mismatch.

function isMacLike(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

const noSubscribe = () => () => {}

/** "⌘K" on a Mac, "Ctrl K" anywhere else. */
export function useShortcutLabel(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => (isMacLike() ? "⌘K" : "Ctrl K"),
    () => "⌘K"
  )
}

// ---------------------------------------------------------------------------
// Opening it from anywhere in the shell.

const PaletteContext = createContext<(() => void) | null>(null)

/** Opens the palette; null outside the shell (the not-found screen), where
 *  a trigger renders nothing rather than a button that does nothing. */
export function usePaletteOpener(): (() => void) | null {
  return useContext(PaletteContext)
}

/** Mounted once, by the authenticated layout: the shortcut, the dialog, and
 *  the context every trigger reads. */
export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  // Each opening is a fresh palette — empty query, top row, a new read —
  // by remounting it under a new key rather than resetting it field by field.
  const [session, setSession] = useState(0)
  const openPalette = useCallback(() => {
    setSession((n) => n + 1)
    setOpen(true)
  }, [])
  // The shortcut toggles; the listener reads the current state through this.
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    const mac = isMacLike()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || event.altKey || event.shiftKey) return
      // One modifier per platform: Ctrl+K on a Mac is the text fields'
      // "delete to the end of the line", and ⌘ doesn't exist elsewhere.
      if (mac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) return
      // Works from inside a field too — and keeps the browser's own Ctrl+K
      // (focus the search bar) from firing under it.
      event.preventDefault()
      if (openRef.current) setOpen(false)
      else openPalette()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [openPalette])

  return (
    <PaletteContext.Provider value={openPalette}>
      {children}
      <CommandPalette key={session} open={open} onOpenChange={setOpen} />
    </PaletteContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Filtering. Case-insensitive, over the label and its metadata; a match that
// starts a word ranks before one found mid-word, and ties keep the index's own
// order (repos and epics as the board orders them, leads as Leads does).

/** 0 for a match at a word start, 1 mid-word, null for no match. */
function rank(entry: PaletteEntry, query: string): number | null {
  const text = `${entry.label} ${entry.meta ?? ""}`.toLowerCase()
  let best: number | null = null
  let from = 0
  for (;;) {
    const at = text.indexOf(query, from)
    if (at === -1) return best
    const atWord = at === 0 || !/[\p{L}\p{N}]/u.test(text[at - 1])
    if (atWord) return 0
    best = 1
    from = at + 1
  }
}

type Shown = { key: PaletteGroup; heading: string; entries: PaletteEntry[] }

function filter(entries: PaletteEntry[], raw: string): Shown[] {
  const query = raw.trim().toLowerCase()
  return GROUPS.map(({ key, heading }) => {
    const inGroup = entries.filter((e) => e.group === key)
    // With nothing typed there is nothing to rank by, so the palette offers
    // what it can *do* rather than a wall of every record.
    if (!query) {
      return { key, heading, entries: key === "actions" ? inGroup.slice(0, GROUP_LIMIT) : [] }
    }
    const ranked = inGroup
      .flatMap((entry, order) => {
        const r = rank(entry, query)
        return r === null ? [] : [{ entry, order, r }]
      })
      .sort((a, b) => a.r - b.r || a.order - b.order)
      .slice(0, GROUP_LIMIT)
      .map((x) => x.entry)
    return { key, heading, entries: ranked }
  }).filter((group) => group.entries.length > 0)
}

// ---------------------------------------------------------------------------
// The dialog.

type Loaded =
  | { state: "loading" }
  | { state: "ready"; index: PaletteIndex }
  | { state: "failed" }

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState("")
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" })
  const [highlight, setHighlight] = useState(0)

  // A fresh read on every open (each open is a new mount — the provider's
  // key); a read that lands after the palette closed again is dropped.
  useEffect(() => {
    if (!open) return
    let current = true
    loadPaletteIndex().then(
      (index) => {
        if (current) setLoaded({ state: "ready", index })
      },
      () => {
        if (current) setLoaded({ state: "failed" })
      }
    )
    return () => {
      current = false
    }
  }, [open])

  const groups = useMemo(() => {
    const index = loaded.state === "ready" ? loaded.index.entries : []
    return filter([...GO_TO, ...index], query)
  }, [loaded, query])

  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups])
  const active = flat.length > 0 ? Math.min(highlight, flat.length - 1) : -1
  const activeId = active >= 0 ? optionId(listId, flat[active].id) : undefined

  // The highlighted row stays in view as the arrows walk past the fold.
  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" })
  }, [activeId])

  function run(entry: PaletteEntry) {
    onOpenChange(false)
    if (entry.href) {
      router.push(entry.href)
    } else if (entry.launch) {
      // A launch opens a session a human then starts — the board's rule: the
      // palette sends nothing itself. A web target gets a new tab; a custom
      // scheme is handed to the OS in place, where a tab would stay blank.
      if (entry.launch.newTab) window.open(entry.launch.url, "_blank", "noreferrer")
      else window.location.assign(entry.launch.url)
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (flat.length === 0) return
      const step = event.key === "ArrowDown" ? 1 : -1
      setHighlight((active + step + flat.length) % flat.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (active >= 0) run(flat[active])
    }
  }

  const notes =
    loaded.state === "ready"
      ? loaded.index.notes
      : loaded.state === "failed"
        ? ["Couldn't load repos, tickets and leads"]
        : []

  return (
    <PaletteShell open={open} onOpenChange={onOpenChange} label="Go anywhere">
      <CommandPaletteInput
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setHighlight(0)
        }}
        onKeyDown={onKeyDown}
        placeholder="Repos, tickets, leads, actions"
        aria-label="Go anywhere"
        aria-controls={listId}
        aria-activedescendant={activeId}
        enterKeyHint="go"
      />
      <CommandPaletteList id={listId}>
        {groups.map((group) => (
          <CommandPaletteGroup key={group.key} heading={group.heading}>
            {group.entries.map((entry) => {
              const index = flat.indexOf(entry)
              return (
                <CommandPaletteItem
                  key={entry.id}
                  id={optionId(listId, entry.id)}
                  selected={index === active}
                  meta={entry.meta}
                  leading={
                    entry.status ? (
                      <StatusDot status={entry.status} label={entry.statusLabel} />
                    ) : undefined
                  }
                  className={cn(entry.group === "repos" && "font-mono text-desk-meta")}
                  // Pointer and keyboard share one highlight, so hovering a
                  // row and pressing Enter runs the row under the pointer.
                  onPointerMove={() => {
                    if (index !== active) setHighlight(index)
                  }}
                  // Keep focus in the field: a click must not blur it first.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => run(entry)}
                >
                  {entry.label}
                </CommandPaletteItem>
              )
            })}
          </CommandPaletteGroup>
        ))}
        {flat.length === 0 ? <CommandPaletteEmpty>Nothing matches</CommandPaletteEmpty> : null}
        {loaded.state === "loading" ? (
          <p className="px-3.5 py-2 text-desk-meta text-desk-fg-3" aria-live="polite">
            Loading repos, tickets and leads…
          </p>
        ) : null}
        {notes.map((note) => (
          <p key={note} className="px-3.5 py-2 text-desk-meta text-desk-fg-3">
            {note}
          </p>
        ))}
      </CommandPaletteList>
    </PaletteShell>
  )
}

/** A DOM-safe id for an option, unique to this palette. */
function optionId(listId: string, entryId: string): string {
  return `${listId}-${entryId.replace(/[^A-Za-z0-9_-]/g, "_")}`
}

// ---------------------------------------------------------------------------
// The phone's trigger, on the title bar. The rail's lives in nav.tsx.

/** The title bar's search button — phones only; from `md` the rail carries
 *  it. Styled as a bar button of the tier the title bar is still on (the app
 *  tier, until each screen moves), like the app menu beside it. */
export function PaletteTitleBarButton() {
  const openPalette = usePaletteOpener()
  if (!openPalette) return null
  return (
    <button
      type="button"
      aria-label="Go anywhere"
      onClick={openPalette}
      className={cn(
        "flex size-app-touch items-center justify-center rounded-app-control",
        "text-material-label transition-colors spring-press active:bg-app-press",
        "md:hidden"
      )}
    >
      <Search className="size-5" aria-hidden />
    </button>
  )
}
