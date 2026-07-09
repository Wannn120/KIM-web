"use client";

import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "@/components/user-menu";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Booking" },
  { href: "/booking-history", label: "History" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="navbar-shell sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="inline-flex items-center gap-3 truncate max-w-[220px] md:max-w-none">
            <img src="/kim-logo.svg" alt="KIM" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <span className="text-base font-semibold text-white sm:text-lg truncate">Klaten Minisoccer</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--muted)] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[color:var(--accent-strong)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[color:var(--foreground)] transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>

          <Link href="/book" className="btn-primary hidden md:inline-flex md:px-3 md:py-1.5">
            Book a field
          </Link>
          <UserMenu />
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 px-4 py-4 shadow-none md:hidden navbar-shell">
          <div className="flex flex-col gap-3 text-sm text-[color:var(--foreground)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 transition hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/book" className="btn-primary block" onClick={() => setMobileOpen(false)}>
              Book a field
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
