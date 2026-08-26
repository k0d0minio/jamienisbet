"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionToken,
  sessionSecret,
} from "@/lib/auth"

export type LoginState = { error?: string }

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "")

  if (!checkPassword(password)) {
    return { error: "Incorrect password." }
  }

  const token = await createSessionToken(sessionSecret())
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  redirect("/")
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect("/login")
}
