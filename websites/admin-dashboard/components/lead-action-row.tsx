import { Mail, MessageCircle, Phone } from "lucide-react"

import { ActionCircle, ActionCircleRow } from "@jamie-nisbet/ui"

import { MarkTouchedButton } from "@/components/mark-touched-button"
import { WorkStartedButton } from "@/components/work-started-button"
import { whatsappUrl } from "@/lib/format"

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
export function LeadActionRow({
  id,
  phone,
  email,
  lastWorked,
  workStartedOn,
}: {
  id: string
  phone: string | null
  email: string | null
  /** Pre-formatted on the server: "today", "12 days". */
  lastWorked: string
  /** Pre-formatted on the server, or null when work hasn't started. */
  workStartedOn: string | null
}) {
  return (
    <ActionCircleRow>
      <ActionCircle
        icon={<Phone />}
        label="Call"
        href={phone ? `tel:${phone}` : undefined}
        disabled={!phone}
        title={phone ?? "No phone number on file"}
      />
      <ActionCircle
        icon={<MessageCircle />}
        label="WhatsApp"
        href={phone ? whatsappUrl(phone) : undefined}
        target="_blank"
        rel="noreferrer"
        disabled={!phone}
        title={phone ? "Open the WhatsApp conversation" : "No phone number on file"}
      />
      <ActionCircle
        icon={<Mail />}
        label="Email"
        href={email ? `mailto:${email}` : undefined}
        disabled={!email}
        title={email ?? "No email address on file"}
      />
      <MarkTouchedButton id={id} lastWorked={lastWorked} />
      <WorkStartedButton id={id} startedOn={workStartedOn} />
    </ActionCircleRow>
  )
}
