"use server"

import { revalidatePath } from "next/cache"

import {
  referralStatuses,
  setReferralStatus,
  type ReferralStatus,
} from "@jamie-nisbet/services"

export async function updateReferralStatus(id: string, status: string) {
  if (!(referralStatuses as readonly string[]).includes(status)) {
    throw new Error(`Unknown referral status: ${status}`)
  }
  await setReferralStatus(id, status as ReferralStatus)
  revalidatePath("/leads/referrals")
  revalidatePath("/")
}
