import type { Metadata } from "next"
import { connection } from "next/server"

import { InboxQueue } from "@/components/inbox-list"
import { loadInbox } from "@/lib/inbox"

export const metadata: Metadata = { title: "Inbox" }

// The Inbox — the fast queue of what Jamie still owes by hand (D-13): outreach
// due, open leads gone quiet, and the nurture wakes whose date has come (D-15).
// It holds follow-ups and nothing else: Money left with the rail (D-17), the
// "worth a look" counts stayed behind as the Leads filters they already were
// (`/leads?crack=unplanned`, `/leads?crack=idle` — D-18), and today's tickets
// are Work's. So this page reads Neon and nothing else — no Stripe, no GitHub.
//
// The server's whole part: read the queue once (lib/inbox.ts, the rule the
// rail's badge reads too) and hand it over as plain rows. Selecting, folding,
// the keys and clearing a row all happen in the browser
// (components/inbox-list.tsx); every write revalidates this path, and the
// fresh read is the truth.
//
// Nothing on this screen sends anything. Reaching someone opens WhatsApp, Mail
// or the phone with nothing sent, and a touch is logged by hand — the estate's
// "no outbound action without review" rule, unbent (D-33).

export default async function InboxPage() {
  // Live state — a read per request, never prerendered.
  await connection()
  return <InboxQueue read={await loadInbox()} />
}
