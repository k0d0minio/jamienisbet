import type { Metadata } from "next"
import { connection } from "next/server"

import { InboxQueue } from "@/components/inbox-list"
import { loadGates } from "@/lib/gates"
import { loadInbox } from "@/lib/inbox"

export const metadata: Metadata = { title: "Inbox" }

// The Inbox — the fast queue of what waits on Jamie (D-13). At its head,
// Gates and PRs (D-14): pull requests waiting on a tick or a merge, red CI,
// blocked runs and scopes waiting for review, read from GitHub across every
// repo on Work's roster (lib/gates.ts). Below them the follow-ups he still owes
// by hand (D-15): outreach due, open leads gone quiet, and the nurture wakes
// whose date has come. Money left with the rail (D-17), the "worth a look"
// counts stayed behind as Leads filters (D-18), and today's tickets are Work's.
//
// The server's whole part: read the follow-ups once (lib/inbox.ts, the rule
// the rail's badge reads too) and hand them over as plain rows, and start the
// gates read beside it — not awaited, so the follow-ups paint without waiting
// on GitHub and the gates stream in when they land. The GitHub read rides the
// board's 60-second cache (no `dynamic = "force-dynamic"` here: it would turn
// that cache off for this whole segment). Selecting, folding, the keys and
// clearing a follow-up all happen in the browser (components/inbox-list.tsx);
// every write revalidates this path, and the fresh read is the truth.
//
// Nothing on this screen sends anything. Reaching someone opens WhatsApp, Mail
// or the phone with nothing sent, and a touch is logged by hand — the estate's
// "no outbound action without review" rule, unbent (D-33). A gate is ticked,
// merged or fixed on GitHub, never from here (D-9).

export default async function InboxPage() {
  // Live state — a read per request, never prerendered.
  await connection()
  const gates = loadGates()
  return <InboxQueue read={await loadInbox()} gates={gates} />
}
