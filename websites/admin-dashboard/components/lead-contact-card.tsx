"use client"

import { useState, useTransition } from "react"
import { Building2, Check, Copy, Mail, Pencil, Phone } from "lucide-react"

import {
  Button,
  Card,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@jamie-nisbet/ui"

import { saveClientContact } from "@/app/(app)/actions"

// Who they are and how to reach them — as things to *act on*, not a form. Each
// row is the action itself (tap the email row and the mail app opens), with a
// copy button beside it for the times the address is going somewhere else.
// Editing lives behind one button, in a bottom sheet, so the page carries the
// details without carrying the input fields — the old profile form put four
// text boxes front and centre for a record that changes maybe twice in its life.

export type ContactDetails = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
}

function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className="text-muted-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard blocked — the value is still readable on the row.
        }
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail
  label: string
  value: string
  href?: string
}) {
  const body = (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm">{value}</span>
      </span>
    </>
  )
  return (
    <div className="flex min-h-14 items-center gap-3 py-1 pr-2 pl-4">
      {href ? (
        <a
          href={href}
          className="-my-1 -ml-4 flex min-w-0 flex-1 items-center gap-3 self-stretch py-1 pl-4 transition-colors active:bg-muted/50"
        >
          {body}
        </a>
      ) : (
        body
      )}
      <CopyValueButton value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  )
}

export function LeadContactCard({ client }: { client: ContactDetails }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const hasAny = Boolean(client.email || client.phone || client.company)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-3 py-1.5 pr-2 pl-4">
        <h2 className="text-sm font-semibold">Contact</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Pencil />
              Edit
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit contact</SheetTitle>
              <SheetDescription>
                Who they are and how to reach them.
              </SheetDescription>
            </SheetHeader>
            <form
              action={(formData) =>
                startTransition(async () => {
                  await saveClientContact(client.id, formData)
                  setOpen(false)
                })
              }
              className="grid gap-3"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  name="name"
                  defaultValue={client.name}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contact-company">Company</Label>
                <Input
                  id="contact-company"
                  name="company"
                  defaultValue={client.company ?? ""}
                  placeholder="—"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  defaultValue={client.email ?? ""}
                  placeholder="—"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={client.phone ?? ""}
                  placeholder="—"
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full sm:w-fit">
                {pending ? "Saving…" : "Save"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {hasAny ? (
        <div className="divide-y border-t">
          {client.email ? (
            <ContactRow
              icon={Mail}
              label="Email"
              value={client.email}
              href={`mailto:${client.email}`}
            />
          ) : null}
          {client.phone ? (
            <ContactRow
              icon={Phone}
              label="Phone"
              value={client.phone}
              href={`tel:${client.phone}`}
            />
          ) : null}
          {client.company ? (
            <ContactRow icon={Building2} label="Company" value={client.company} />
          ) : null}
        </div>
      ) : (
        <p className="border-t px-4 py-4 text-sm text-muted-foreground">
          No contact details yet — add them with Edit.
        </p>
      )}
    </Card>
  )
}
