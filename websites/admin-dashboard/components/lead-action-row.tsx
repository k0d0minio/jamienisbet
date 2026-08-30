import { Mail, MessageCircle, Phone } from "lucide-react"

import { ActionCircle, ActionCircleRow } from "@jamie-nisbet/ui"

import { MarkTouchedButton } from "@/components/mark-touched-button"
import { WorkStartedButton } from "@/components/work-started-button"
import { whatsappUrl } from "@/lib/format"
import { NO_SUPPRESSIONS, type SuppressedChannels } from "@/lib/suppression"

// The five things you open a lead's page on a phone to do, as the Contacts
// idiom does them: tinted discs directly under the identity, in a fixed order
// so the position of an action is learnable.
//
// An action the record can't support is disabled rather than dropped — a lead
// with no number should read as "no number on file", not as a page with one
// fewer disc, and the row keeps the same shape for everyone.
//
// Call and WhatsApp are separate on purpose: the number itself always opens the
// conversation (nothing on this page surprise-dials anyone), and dialling is
// its own deliberate disc.
//
// A channel somebody opted out of is disabled by the same rule and for a
// stronger reason: "no number on file" and "they asked not to be called" are
// both the absence of a way to reach them, and the second one is the absence
// this app must never let a thumb tap through. The title says which.
export function LeadActionRow({
  id,
  phone,
  whatsapp,
  email,
  lastWorked,
  workStartedOn,
  // Defaults to "nothing closed", so a caller that hasn't looked renders the
  // row exactly as it read before opt-outs existed.
  suppressed = NO_SUPPRESSIONS,
}: {
  id: string
  phone: string | null
  /** Their own click-to-chat number, when WhatsApp isn't the phone number. */
  whatsapp: string | null
  email: string | null
  /** Which of these channels have opted out — resolved on the server. */
  suppressed?: SuppressedChannels
  /** Pre-formatted on the server: "today", "12 days". */
  lastWorked: string
  /** Pre-formatted on the server, or null when work hasn't started. */
  workStartedOn: string | null
}) {
  // WhatsApp is its own line for some of the businesses in the cold pool, and
  // the phone number for everyone else — so the disc follows the number rather
  // than the column, the same rule the contact rows and the list's swipe tray
  // follow.
  const chat = whatsapp ?? phone

  const canCall = Boolean(phone) && !suppressed.phone
  const canChat = Boolean(chat) && !suppressed.whatsapp
  const canEmail = Boolean(email) && !suppressed.email

  return (
    <ActionCircleRow>
      <ActionCircle
        icon={<Phone />}
        label="Call"
        href={phone && !suppressed.phone ? `tel:${phone}` : undefined}
        disabled={!canCall}
        title={
          suppressed.phone
            ? "They opted out — don't call this number"
            : (phone ?? "No phone number on file")
        }
      />
      <ActionCircle
        icon={<MessageCircle />}
        label="WhatsApp"
        href={chat && !suppressed.whatsapp ? whatsappUrl(chat) : undefined}
        target="_blank"
        rel="noreferrer"
        disabled={!canChat}
        title={
          suppressed.whatsapp
            ? "They opted out — don't message this number"
            : chat
              ? "Open the WhatsApp conversation"
              : "No number on file"
        }
      />
      <ActionCircle
        icon={<Mail />}
        label="Email"
        href={email && !suppressed.email ? `mailto:${email}` : undefined}
        disabled={!canEmail}
        title={
          suppressed.email
            ? "They opted out — don't email this address"
            : (email ?? "No email address on file")
        }
      />
      <MarkTouchedButton id={id} lastWorked={lastWorked} />
      <WorkStartedButton id={id} startedOn={workStartedOn} />
    </ActionCircleRow>
  )
}
