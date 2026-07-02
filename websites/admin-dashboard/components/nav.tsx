import Link from "next/link"

import { Button } from "@jamie-nisbet/ui"

import { logout } from "@/app/login/actions"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/leads/contact", label: "Contact" },
  { href: "/leads/referrals", label: "Referrals" },
  { href: "/finances", label: "Finances" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payment-links", label: "Payment links" },
]

export function Nav() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <span className="font-semibold">Admin</span>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="ml-auto">
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  )
}
