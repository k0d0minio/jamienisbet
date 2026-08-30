"use client"

import { useState, useTransition } from "react"
import {
  Building2,
  Check,
  Copy,
  Instagram,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
} from "lucide-react"

import {
  AppField,
  AppInput,
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"

import { saveClientContact } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"
import { instagramUrl, whatsappUrl } from "@/lib/format"

// Who they are and how to reach them — as things to *act on*, not a form. Each
// row is the action itself (tap the email row and the mail app opens), with a
// copy button riding beside it as the row's accessory for the times the
// address is going somewhere else. It sits directly under the action discs
// because that is where the Contacts idiom puts a person's facts.
//
// Four channels now, not two. Cold outreach to a local business here runs on
// WhatsApp and Instagram at least as much as on email, so both are rows rather
// than facts buried on a profile — and WhatsApp gets its own number, because
// the businesses whose WhatsApp is a different line are exactly the ones a
// click-to-chat link would otherwise send to the wrong place.
//
// Editing lives behind the last row, in a sheet, so the page carries the
// details without carrying the input fields — the old profile form put four
// text boxes front and centre for a record that changes maybe twice in its life.

export type ContactDetails = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  /** The click-to-chat number when it isn't the phone number. */
  whatsapp: string | null
  /** The handle, stored without its '@'. */
  instagram: string | null
}

function CopyValueButton({
  value,
  label,
  what,
}: {
  value: string
  label: string
  /** What landed on the clipboard, for the toast ("Email", "Phone"). */
  what: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className="text-app-label-3"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          // The tick is a 24px icon at the end of a row; on a phone, mid-scroll,
          // the toast is what actually gets seen.
          toast(`${what} copied`)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error("Couldn't reach the clipboard — copy it by hand")
        }
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  )
}

export function LeadContactCard({ client }: { client: ContactDetails }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // What a wa.me link is built from: their own WhatsApp number if they have
  // one, otherwise the phone number, which is the same for most businesses.
  const chat = client.whatsapp ?? client.phone

  const hasAny = Boolean(
    client.email || client.phone || client.company || client.instagram
  )

  return (
    <GroupedSection header="Contact">
      {client.email ? (
        <GroupedRow
          icon={<Mail />}
          label="Email"
          value={client.email}
          href={`mailto:${client.email}`}
          accessory={
            <CopyValueButton
              value={client.email}
              label="Copy email"
              what="Email"
            />
          }
        />
      ) : null}

      {chat ? (
        // The number reads as itself but opens the WhatsApp conversation —
        // tapping it should never surprise-dial the lead. Dialling has its own
        // disc in the action row. It is the dedicated WhatsApp number when
        // there is one and the phone number otherwise, which is the same rule
        // the wa.me links everywhere else in the app follow.
        <GroupedRow
          icon={<MessageCircle />}
          label="WhatsApp"
          value={<span className="font-mono">{chat}</span>}
          href={whatsappUrl(chat)}
          target="_blank"
          rel="noreferrer"
          accessory={
            <CopyValueButton
              value={chat}
              label="Copy WhatsApp number"
              what="WhatsApp number"
            />
          }
        />
      ) : null}

      {/* Only when the two numbers actually differ. Where WhatsApp *is* the
          phone number the row above has already shown it, and a second row
          saying the same digits is noise. */}
      {client.phone && client.phone !== chat ? (
        <GroupedRow
          icon={<Phone />}
          label="Phone"
          value={<span className="font-mono">{client.phone}</span>}
          chevron={false}
          accessory={
            <CopyValueButton
              value={client.phone}
              label="Copy phone number"
              what="Phone"
            />
          }
        />
      ) : null}

      {client.instagram ? (
        // Stored bare; the '@' is punctuation, so it is put back here rather
        // than kept in the column.
        <GroupedRow
          icon={<Instagram />}
          label="Instagram"
          value={`@${client.instagram}`}
          href={instagramUrl(client.instagram)}
          target="_blank"
          rel="noreferrer"
          accessory={
            <CopyValueButton
              value={`@${client.instagram}`}
              label="Copy Instagram handle"
              what="Handle"
            />
          }
        />
      ) : null}

      {client.company ? (
        <GroupedRow
          icon={<Building2 />}
          label="Company"
          value={client.company}
          chevron={false}
          accessory={
            <CopyValueButton
              value={client.company}
              label="Copy company"
              what="Company"
            />
          }
        />
      ) : null}

      {hasAny ? null : (
        <GroupedBlock>
          No contact details yet — add them below.
        </GroupedBlock>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <GroupedRow icon={<Pencil />} label="Edit contact" />
        </SheetTrigger>
        <SheetContent detents={["medium", "large"]}>
          <SheetHeader>
            <SheetTitle>Edit contact</SheetTitle>
            <SheetDescription>
              Who they are and how to reach them.
            </SheetDescription>
          </SheetHeader>
          <form
            action={(formData) =>
              startTransition(async () => {
                hapticTick()
                try {
                  await saveClientContact(client.id, formData)
                  setOpen(false)
                } catch {
                  // The sheet stays open on a failure, so the fields you
                  // typed are still there to try again with.
                  toast.error("Couldn't save the contact details")
                }
              })
            }
            className="grid gap-3"
          >
            <AppField label="Name">
              <AppInput
                name="name"
                defaultValue={client.name}
                required
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
              />
            </AppField>
            <AppField label="Company">
              <AppInput
                name="company"
                defaultValue={client.company ?? ""}
                placeholder="—"
                autoComplete="organization"
                autoCapitalize="words"
                enterKeyHint="next"
              />
            </AppField>
            <AppField label="Email">
              <AppInput
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                defaultValue={client.email ?? ""}
                placeholder="—"
              />
            </AppField>
            <AppField label="Phone">
              <AppInput
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                defaultValue={client.phone ?? ""}
                placeholder="—"
              />
            </AppField>
            <AppField
              label="WhatsApp"
              hint="Only if it isn't the phone number above."
            >
              <AppInput
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                enterKeyHint="next"
                defaultValue={client.whatsapp ?? ""}
                placeholder="—"
              />
            </AppField>
            <AppField label="Instagram" hint="The handle, with or without the @.">
              <AppInput
                name="instagram"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                // Last field in the sheet — the return key saves rather than
                // asking for another one.
                enterKeyHint="done"
                defaultValue={client.instagram ? `@${client.instagram}` : ""}
                placeholder="—"
              />
            </AppField>
            <PendingButton
              pending={pending}
              pendingText="Saving…"
              className="w-full sm:w-fit"
            >
              Save
            </PendingButton>
          </form>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
