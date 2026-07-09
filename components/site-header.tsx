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
    <header className="navbar-shell sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-base font-semibold text-white sm:text-lg">
            Klaten Minisoccer
          </Link>
          <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300 sm:inline-block">
            1 field, premium booking
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
        </button>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-cyan-400">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/book" className="btn-primary hidden md:inline-flex">
            Book a field
          </Link>
          <UserMenu />
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 shadow-2xl shadow-black/20 backdrop-blur md:hidden">
          <div className="flex flex-col gap-3 text-sm text-slate-200">
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
            <Link
              href="/book"
              className="block rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              onClick={() => setMobileOpen(false)}
            >
              Book a field
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
