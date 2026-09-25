"use server"

import { updateTag } from "next/cache"

import {
  BOARD_CACHE_TAG,
  BOARD_POSITION_TAG,
  GATES_CACHE_TAG,
} from "@/lib/tickets"

// The board's reads deliberately ride a 60-second cache — right for a glance,
// wrong for the moment you've just merged something and want the truth. This
// action busts every tagged GitHub read at once; the button that calls it
// follows up with router.refresh() so the re-render actually re-fetches.
// `updateTag`, not `revalidateTag(tag, "max")`: the latter is
// stale-while-revalidate, which would hand the refresh tap the very stale
// board it exists to replace — updateTag expires now and the next read waits
// for fresh data.
export async function refreshBoard(): Promise<void> {
  updateTag(BOARD_CACHE_TAG)
}

// The quiet re-read when the app comes back after a while away: only "what
// moved" — each repo's tree and the today list — is expired, so it costs one
// tree call per repo and re-reads only the ticket files whose SHA changed.
// The estate's shape (hourly) and every unchanged body stay cached. It still
// has to expire something: an expired entry left alone is served stale while
// it refreshes in the background, which would re-show the board you left.
export async function refreshBoardPosition(): Promise<void> {
  updateTag(BOARD_POSITION_TAG)
}

// The Inbox's refresh control: its pull-request read and every repo's tree —
// what a tick, a merge or a scope taken into Define changes — so a gate
// resolved on GitHub leaves the group on this re-read rather than within the
// minute. `updateTag` for the same reason as above: a clock-expired entry is
// served stale while it refreshes.
export async function refreshGates(): Promise<void> {
  updateTag(GATES_CACHE_TAG)
  updateTag(BOARD_POSITION_TAG)
}
