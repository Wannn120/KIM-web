export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>MiniSoccer • Smart field booking for players and teams.</p>
        <div className="flex gap-4">
          <span>WhatsApp ready</span>
          <span>Midtrans ready</span>
          <span>Admin dashboard</span>
        </div>
      </div>
    </footer>
  );
}
