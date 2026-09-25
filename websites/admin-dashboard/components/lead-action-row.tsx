"use client"

import {
  Archive,
  ArchiveRestore,
  Ellipsis,
  Mail,
  MessageCircle,
  PenLine,
  Phone,
  Plus,
  ShieldBan,
  Trash2,
} from "lucide-react"

import {
  DeskButton,
  DeskMenu,
  DeskMenuContent,
  DeskMenuItem,
  DeskMenuSeparator,
  DeskMenuTrigger,
} from "@jamie-nisbet/ui"

import { useClientActions } from "@/components/client-actions"
import { KeyHint, useLeadProfile } from "@/components/lead-profile"
import { MarkTouchedButton } from "@/components/mark-touched-button"
import { WorkStartedButton } from "@/components/work-started-button"
import { whatsappUrl } from "@/lib/format"
import { NO_SUPPRESSIONS, type SuppressedChannels } from "@/lib/suppression"

// The lead's action bar: everything you open this page to *do*, in one row
// under the identity, in a fixed order so the position of an action is
// learnable — reach them (call, WhatsApp, email), record it (log a touch,
// touched today), say something (write a draft), and start the work. The
// three that can't be taken back — archive, opt out, delete — are behind the
// menu at the trailing end, never a button in the page and never in the
// bottom of a phone screen where a thumb rests.
//
// A channel the record can't support is disabled rather than dropped — a lead
// with no number reads as "no number on file", not as a bar with one fewer
// button — and a channel somebody opted out of is disabled by the same rule
// and for a stronger reason; the title says which.
//
// Call and WhatsApp are separate on purpose: the number itself always opens
// the conversation (nothing on this page surprise-dials anyone), and dialling
// is its own deliberate button.

function ChannelButton({
  icon,
  label,
  href,
  newTab = false,
  title,
}: {
  icon: React.ReactNode
  label: string
  /** Null when there is no way through — then the button is disabled. */
  href: string | null
  newTab?: boolean
  title: string
}) {
  if (href === null) {
    return (
      <DeskButton variant="secondary" disabled title={title}>
        {icon}
        {label}
      </DeskButton>
    )
  }
  return (
    <DeskButton variant="secondary" asChild title={title}>
      <a
        href={href}
        {...(newTab ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {icon}
        {label}
      </a>
    </DeskButton>
  )
}

export function LeadActionRow({
  id,
  phone,
  whatsapp,
  email,
  lastWorked,
  workStartedOn,
  archived,
  canOptOut,
  // Defaults to "nothing closed", so a caller that hasn't looked renders the
  // bar exactly as it read before opt-outs existed.
  suppressed = NO_SUPPRESSIONS,
}: {
  id: string
  phone: string | null
  /** Their own click-to-chat number, when WhatsApp isn't the phone number. */
  whatsapp: string | null
  email: string | null
  /** Pre-formatted on the server: "today", "12 days". */
  lastWorked: string
  /** Pre-formatted on the server, or null when work hasn't started. */
  workStartedOn: string | null
  archived: boolean
  /** Whether any channel is still open to close. */
  canOptOut: boolean
  /** Which of these channels have opted out — resolved on the server. */
  suppressed?: SuppressedChannels
}) {
  const profile = useLeadProfile()
  const { pending, onArchive, onDelete } = useClientActions({
    id,
    archived,
    redirectOnDelete: "/leads",
  })

  // WhatsApp is its own line for some of the businesses in the cold pool, and
  // the phone number for everyone else — so the button follows the number
  // rather than the column, the same rule the contact rows and the list's
  // swipe tray follow.
  const chat = whatsapp ?? phone

  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      <ChannelButton
        icon={<Phone aria-hidden />}
        label="Call"
        href={phone && !suppressed.phone ? `tel:${phone}` : null}
        title={
          suppressed.phone
            ? "They opted out — don't call this number"
            : (phone ?? "No phone number on file")
        }
      />
      <ChannelButton
        icon={<MessageCircle aria-hidden />}
        label="WhatsApp"
        href={chat && !suppressed.whatsapp ? whatsappUrl(chat) : null}
        newTab
        title={
          suppressed.whatsapp
            ? "They opted out — don't message this number"
            : (chat ?? "No number on file")
        }
      />
      <ChannelButton
        icon={<Mail aria-hidden />}
        label="Email"
        href={email && !suppressed.email ? `mailto:${email}` : null}
        title={
          suppressed.email
            ? "They opted out — don't email this address"
            : (email ?? "No email address on file")
        }
      />

      <span aria-hidden className="mx-1 hidden h-5 w-px bg-desk-line sm:block" />

      <DeskButton
        variant="primary"
        data-lead-shortcut="l"
        aria-keyshortcuts="L"
        onClick={() => profile?.setLogOpen(true)}
      >
        <Plus aria-hidden />
        Log a touch
        <KeyHint>L</KeyHint>
      </DeskButton>
      <MarkTouchedButton id={id} lastWorked={lastWorked} />
      <DeskButton
        variant="secondary"
        onClick={() => profile?.showTab("draft", true)}
      >
        <PenLine aria-hidden />
        Write a draft
      </DeskButton>
      <WorkStartedButton id={id} startedOn={workStartedOn} />

      {/* `modal={false}`: an item here opens a sheet, and two modal layers
          handing focus to each other leave the page inert behind them. */}
      <DeskMenu modal={false}>
        <DeskMenuTrigger asChild>
          <DeskButton
            variant="ghost"
            size="icon"
            aria-label="More: archive, opt out, delete"
            title="Archive, opt out, delete"
            className="ml-auto"
            disabled={pending}
          >
            <Ellipsis aria-hidden />
          </DeskButton>
        </DeskMenuTrigger>
        <DeskMenuContent align="end">
          <DeskMenuItem
            onSelect={onArchive}
            description={
              archived
                ? "Back on the list"
                : "Off the list; the record is kept"
            }
          >
            {archived ? (
              <ArchiveRestore aria-hidden />
            ) : (
              <Archive aria-hidden />
            )}
            {archived ? "Restore" : "Archive"}
          </DeskMenuItem>
          <DeskMenuItem
            disabled={!canOptOut}
            onSelect={() => profile?.setOptOutOpen(true)}
            description={
              canOptOut
                ? "They asked not to be contacted"
                : "Nothing left to close"
            }
          >
            <ShieldBan aria-hidden />
            Opt out…
          </DeskMenuItem>
          <DeskMenuSeparator />
          <DeskMenuItem
            variant="destructive"
            onSelect={onDelete}
            description="Can't be undone"
          >
            <Trash2 aria-hidden />
            Delete
          </DeskMenuItem>
        </DeskMenuContent>
      </DeskMenu>
    </div>
  )
}
