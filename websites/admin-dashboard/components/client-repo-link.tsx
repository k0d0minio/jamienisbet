"use client"

import { useEffect, useState, useTransition } from "react"

import { Button, Input, Label, Switch } from "@jamie-nisbet/ui"

import {
  connectClientRepo,
  createClientRepo,
  disconnectClientRepo,
  listConnectableRepos,
} from "@/app/(app)/clients/actions"

// The client's delivery-repo surface on their profile. When a client comes in,
// this is the prompt to either connect an existing repo or create a fresh one;
// once connected it shows the link and lets Jamie disconnect. A connected repo
// is what the pipeline's AI runs analyse (see lib/deal-context.ts), so the whole
// point of connecting here is more tailored pitches/proposals downstream.

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
          className="font-mono text-sm underline underline-offset-2 hover:text-foreground"
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
        Connected — the brainstorm, pitch, and proposal runs now analyse this
        repo for tailored suggestions.
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
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id="connect-repo"
          list="repo-options"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner/name"
          className="min-w-56 flex-1 font-mono"
        />
        <datalist id="repo-options">
          {repos.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <Button
          type="button"
          size="sm"
          variant="outline"
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
        size="sm"
        disabled={pending || name.trim() === ""}
        className="w-fit"
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

  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        Connect this client&apos;s delivery repo so the pipeline can analyse it
        for more tailored suggestions.
      </p>
      <ConnectExisting id={id} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <CreateNew id={id} suggestedName={suggestedName} />
    </div>
  )
}
