"use server"

import { revalidatePath } from "next/cache"

import {
  deleteContactSubmission,
  deleteReferralLead,
  referralStatuses,
  setContactArchived,
  setReferralArchived,
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

// ---- Contact submissions ---------------------------------------------------

export async function archiveContact(id: string, archived: boolean) {
  await setContactArchived(id, archived)
  revalidatePath("/leads/contact")
  revalidatePath("/")
}

export async function removeContact(id: string) {
  await deleteContactSubmission(id)
  revalidatePath("/leads/contact")
  revalidatePath("/")
}

// ---- Referral leads --------------------------------------------------------

export async function archiveReferral(id: string, archived: boolean) {
  await setReferralArchived(id, archived)
  revalidatePath("/leads/referrals")
  revalidatePath("/")
}

export async function removeReferral(id: string) {
  await deleteReferralLead(id)
  revalidatePath("/leads/referrals")
  revalidatePath("/")
}
