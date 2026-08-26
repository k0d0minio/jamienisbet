import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LogoMark,
} from "@jamie-nisbet/ui"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <LogoMark className="size-6" />
            <CardTitle>Consultancy JN</CardTitle>
          </div>
          <CardDescription>Sign in to operate the business.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
