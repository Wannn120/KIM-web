import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/fields", label: "Fields" },
  { href: "/book", label: "Book" },
  { href: "/login", label: "Login" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-white">
          MiniSoccer
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-cyan-400">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/fields"
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          Book a Field
        </Link>
      </div>
    </header>
  );
}
