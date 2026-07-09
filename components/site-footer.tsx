export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 navbar-shell">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-4 text-sm text-slate-300">
          <p className="font-semibold text-white">MiniSoccer</p>
          <p>Mini soccer field booking, secure payments, and live availability for players in Indonesia.</p>
          <p>Need help? Email us at <a href="mailto:hello@minisoccer.id" className="text-[color:var(--accent)]">hello@minisoccer.id</a></p>
          <p>Follow us on:</p>
          <div className="flex flex-wrap gap-3 text-slate-400">
            <a href="#" className="transition hover:text-[color:var(--accent)]">Instagram</a>
            <a href="#" className="transition hover:text-[color:var(--accent)]">WhatsApp</a>
            <a href="#" className="transition hover:text-[color:var(--accent)]">TikTok</a>
          </div>
        </div>

        <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <p className="mb-3 font-semibold text-white">Quick links</p>
            <ul className="space-y-2">
              <li><a href="/fields" className="transition hover:text-[color:var(--accent)]">Fields</a></li>
              <li><a href="/book" className="transition hover:text-[color:var(--accent)]">Book now</a></li>
              <li><a href="/payment" className="transition hover:text-[color:var(--accent)]">Payment</a></li>
              <li><a href="/admin" className="transition hover:text-[color:var(--accent)]">Admin</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-white">Support</p>
            <ul className="space-y-2">
              <li>Contact: +62 812 3456 7890</li>
              <li>Email: <a href="mailto:hello@minisoccer.id" className="text-[color:var(--accent)]">hello@minisoccer.id</a></li>
              <li>Office: Jakarta Selatan, Indonesia</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
