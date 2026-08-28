"use server"

import { updateTag } from "next/cache"

import { BOARD_CACHE_TAG } from "@/lib/tickets"

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
