export function DesignSystemPreview() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-white">Typography</h2>
        <div className="mt-4 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Heading 1</h1>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Heading 2</h2>
          <h3 className="text-2xl font-semibold text-white">Heading 3</h3>
          <p className="max-w-2xl text-base text-[color:var(--muted)]">Body copy with a clean SaaS-style rhythm and comfortable spacing for modern dashboards.</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white">Buttons</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary">Primary</button>
          <button className="btn-secondary">Secondary</button>
          <button className="btn-ghost">Ghost</button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white">Cards</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-6">
            <p className="text-sm text-[color:var(--muted)]">Surface card</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Elevated content</h3>
          </div>
          <div className="card-glow p-6">
            <p className="text-sm text-[color:var(--accent)]">Glow card</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Interactive highlight</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
