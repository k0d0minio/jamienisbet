"use client"

import { useEffect, useState, useTransition } from "react"
import { ChevronRight } from "lucide-react"

import { Button, Input, Label, Switch } from "@jamie-nisbet/ui"

import {
  connectClientRepo,
  createClientRepo,
  disconnectClientRepo,
  listConnectableRepos,
} from "@/app/(app)/actions"

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
          className="font-mono text-sm break-all underline underline-offset-2 hover:text-foreground"
        >
          {githubRepo} ↗
        </a>
        {githubDefaultBranch ? (
          <span className="font-mono text-xs text-muted-foreground">
            {githubDefaultBranch}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Connected — this is where the delivery work for them lives.
      </p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="w-fit text-muted-foreground"
        onClick={() => {
          setError(null)
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function ConnectExisting({ id }: { id: string }) {
  const [value, setValue] = useState("")
  const [repos, setRepos] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Pull the account's repos once, to back the datalist. Best-effort: an empty
  // list just means Jamie types "owner/name" by hand.
  useEffect(() => {
    let live = true
    listConnectableRepos()
      .then((rows) => {
        if (live) setRepos(rows.map((r) => r.fullName))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="grid gap-2">
      <Label htmlFor="connect-repo">Connect an existing repo</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          id="connect-repo"
          list="repo-options"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner/name"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
            startTransition(async () => {
              try {
                await connectClientRepo(id, value)
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function CreateNew({ id, suggestedName }: { id: string; suggestedName: string }) {
  const [name, setName] = useState(suggestedName)
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="grid gap-2">
      <Label htmlFor="create-repo">Create a new repo</Label>
      <Input
        id="create-repo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="repo-name"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="font-mono"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="flex items-center gap-2">
        <Switch
          id="repo-private"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
        <Label htmlFor="repo-private" className="text-xs font-normal">
          Private
        </Label>
      </div>
      <Button
        type="button"
        disabled={pending || name.trim() === ""}
        className="w-full sm:w-fit"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              await createClientRepo(id, {
                name,
                description,
                isPrivate,
              })
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function ClientRepoLink({
  id,
  githubRepo,
  githubDefaultBranch,
  configured,
  suggestedName,
}: {
  id: string
  githubRepo: string | null
  githubDefaultBranch: string | null
  configured: boolean
  suggestedName: string
}) {
  if (githubRepo) {
    return (
      <Connected
        id={id}
        githubRepo={githubRepo}
        githubDefaultBranch={githubDefaultBranch}
      />
    )
  }

  if (!configured) {
    return (
      <p className="text-xs text-muted-foreground">
        GitHub is not configured — set <code>GITHUB_TOKEN</code> to connect a
        delivery repo.
      </p>
    )
  }

  // Two forms' worth of controls for something you do once per customer, if
  // ever. Folded away until asked for, so an unconnected lead costs one line
  // rather than a screen of scroll on a phone.
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRight
          className="size-4 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden
        />
        Connect a delivery repo
      </summary>
      <div className="grid gap-4 pt-2">
        <p className="text-xs text-muted-foreground">
          Point at the repo their delivery work lives in, or create a fresh one.
        </p>
        <ConnectExisting id={id} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <CreateNew id={id} suggestedName={suggestedName} />
      </div>
    </details>
  )
}
