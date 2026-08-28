"use server"

import { revalidateTag } from "next/cache"

import { BOARD_CACHE_TAG } from "@/lib/tickets"

// The board's reads deliberately ride a 60-second cache — right for a glance,
// wrong for the moment you've just merged something and want the truth. This
// action busts every tagged GitHub read at once; the button that calls it
// follows up with router.refresh() so the re-render actually re-fetches.
export async function refreshBoard(): Promise<void> {
  revalidateTag(BOARD_CACHE_TAG)
}
