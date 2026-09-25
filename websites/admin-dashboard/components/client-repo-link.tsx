"use client"

import { type ReactNode, useEffect, useState, useTransition } from "react"
import { ChevronRight, TriangleAlert } from "lucide-react"

import { DeskField, DeskInput, DeskLabel, Button, Switch } from "@jamie-nisbet/ui"

import {
  connectClientRepo,
  createClientRepo,
  disconnectClientRepo,
  listConnectableRepos,
} from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"

// The delivery-repo surface on a lead's profile. Once work is won, this is
// where Jamie either points them at an existing repo or spins up a fresh one;
// after that it shows the link and lets him disconnect. The pointer lives on
// the lead row, so the dashboard always knows where a customer's work lives.

type ConnectedProps = {
  id: string
  githubRepo: string
  githubDefaultBranch: string | null
}

function Connected({ id, githubRepo, githubDefaultBranch }: ConnectedProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://github.com/${githubRepo}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-desk-ui break-all underline underline-offset-2 hover:text-desk-fg"
        >
          {githubRepo} ↗
        </a>
        {githubDefaultBranch ? (
          <span className="font-mono text-desk-meta text-desk-fg-3">
            {githubDefaultBranch}
          </span>
        ) : null}
      </div>
      <p className="text-desk-meta text-desk-fg-3">
        Connected — this is where the delivery work for them lives.
      </p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="w-fit text-desk-fg-3"
        onClick={() => {
          setError(null)
          hapticTick()
          startTransition(async () => {
            try {
              await disconnectClientRepo(id)
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not disconnect."
              )
            }
          })
        }}
      >
        {pending ? "Disconnecting…" : "Disconnect"}
      </Button>
      {error ? <RepoError>{error}</RepoError> : null}
    </div>
  )
}

// A failure that belongs to a whole block rather than to one field — the
// disconnect that was refused, the repo GitHub would not create. Drawn the way
// DeskField draws a field's error, glyph included, so the two never read as
// different kinds of bad news.
function RepoError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-desk-meta text-destructive"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

function ConnectExisting({ id }: { id: string }) {
  const [value, setValue] = useState("")
  const [repos, setRepos] = useState<string[]>([])
  const [listingError, setListingError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Pull the account's repos once, to back the datalist. Still best-effort —
  // the field takes an "owner/name" typed by hand and always did — but a
  // listing that failed says so as a hint rather than passing for an account
  // with nothing in it. It is the field's hint and not its error because
  // nothing is blocked: the suggestions are missing, not the flow.
  useEffect(() => {
    let live = true
    listConnectableRepos()
      .then(({ repos: rows, error: listError }) => {
        if (!live) return
        setRepos(rows.map((r) => r.fullName))
        setListingError(listError)
      })
      .catch(() => {
        if (live) setListingError("GitHub didn't answer.")
      })
    return () => {
      live = false
    }
  }, [])

  return (
    <DeskField
      label="Connect an existing repo"
      hint={
        listingError
          ? `Type the full owner/name — the suggestions didn't load. ${listingError}`
          : undefined
      }
      error={error}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <DeskInput
          list="repo-options"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner/name"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          // A repo name is data, not prose — mono, like every other figure and
          // identifier on this tier.
          className="font-mono sm:min-w-56 sm:flex-1"
        />
        <datalist id="repo-options">
          {repos.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={pending || value.trim() === ""}
          onClick={() => {
            setError(null)
            hapticTick()
            startTransition(async () => {
              try {
                const result = await connectClientRepo(id, value)
                if (!result.ok) setError(result.message)
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Could not connect."
                )
              }
            })
          }}
        >
          {pending ? "Connecting…" : "Connect"}
        </Button>
      </div>
    </DeskField>
  )
}

function CreateNew({
  id,
  suggestedName,
  onScaffoldError,
}: {
  id: string
  suggestedName: string
  /** Reported upwards rather than shown here: a scaffold warning arrives with
   * the repo connected, which unmounts this form. */
  onScaffoldError: (message: string) => void
}) {
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="grid gap-2">
      <DeskField label="Create a new repo">
        <DeskInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="repo-name"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="font-mono"
        />
      </DeskField>
      <DeskInput
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        aria-label="Repo description"
      />
      <div className="flex min-h-desk-control items-center gap-2">
        <Switch
          id="repo-private"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
        <DeskLabel htmlFor="repo-private" className="font-normal">
          Private
        </DeskLabel>
      </div>
      <Button
        type="button"
        disabled={pending || name.trim() === ""}
        className="w-full sm:w-fit"
        onClick={() => {
          setError(null)
          hapticTick()
          startTransition(async () => {
            try {
              const { scaffoldError } = await createClientRepo(id, {
                name,
                description,
                isPrivate,
              })
              if (scaffoldError) onScaffoldError(scaffoldError)
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not create the repo."
              )
            }
          })
        }}
      >
        {pending ? "Creating…" : "Create & connect"}
      </Button>
      {error ? <RepoError>{error}</RepoError> : null}
    </div>
  )
}

export function ClientRepoLink({
  id,
  githubRepo,
  githubDefaultBranch,
  configured,
  suggestedName,
  expanded = false,
}: {
  id: string
  githubRepo: string | null
  githubDefaultBranch: string | null
  configured: boolean
  suggestedName: string
  /** Drop the fold and show the two forms outright — for a sheet that exists
   *  to do exactly this, where folding would only cost a tap. */
  expanded?: boolean
}) {
  // A failed `.icm/` seeding is held here, not in the create form: the repo is
  // created and connected regardless, so the moment it is reported this
  // component has already flipped to the connected view. Keeping it at this
  // level is what lets the sentence survive that flip.
  const [scaffoldError, setScaffoldError] = useState<string | null>(null)

  const scaffoldNotice = scaffoldError ? (
    <p className="text-desk-meta text-destructive">{scaffoldError}</p>
  ) : null

  if (githubRepo) {
    return (
      <div className="grid gap-2">
        <Connected
          id={id}
          githubRepo={githubRepo}
          githubDefaultBranch={githubDefaultBranch}
        />
        {scaffoldNotice}
      </div>
    )
  }

  if (!configured) {
    return (
      <p className="text-desk-meta text-desk-fg-3">
        GitHub is not configured — set <code>GITHUB_TOKEN</code> to connect a
        delivery repo.
      </p>
    )
  }

  const connect = (
    <>
      <p className="text-desk-meta text-desk-fg-3">
        Point at the repo their delivery work lives in, or create a fresh one.
      </p>
      <ConnectExisting id={id} />
      <div className="flex items-center gap-3 text-desk-meta text-desk-fg-3">
        <span className="h-px flex-1 bg-desk-line" />
        or
        <span className="h-px flex-1 bg-desk-line" />
      </div>
      <CreateNew
        id={id}
        suggestedName={suggestedName}
        onScaffoldError={setScaffoldError}
      />
      {scaffoldNotice}
    </>
  )

  // Already in a sheet of its own: the fold would be a tap between the person
  // and the only thing the sheet is for.
  if (expanded) return <div className="grid gap-4">{connect}</div>

  // Two forms' worth of controls for something you do once per customer, if
  // ever. Folded away until asked for, so an unconnected lead costs one line
  // rather than a screen of scroll on a phone.
  return (
    <details className="group">
      <summary className="flex min-h-desk-control cursor-pointer list-none items-center gap-2 text-desk-ui text-desk-fg-3 transition-colors hover:text-desk-fg">
        <ChevronRight
          className="size-4 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden
        />
        Connect a delivery repo
      </summary>
      <div className="grid gap-4 pt-2">{connect}</div>
    </details>
  )
}
