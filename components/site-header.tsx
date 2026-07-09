import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Booking" },
  { href: "/booking-history", label: "History" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="navbar-shell sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold text-white">
            Klaten International Minisoccer
          </Link>
          <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-300 sm:inline-block">
            1 field, premium booking
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-cyan-400">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="btn-primary hidden md:inline-flex"
          >
            Book a field
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
