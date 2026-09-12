import { DesignSystemPreview } from "@/components/design-system";

export const dynamic = "force-dynamic";

export default function DesignSystemPage() {
  return (
    <main className="flex-1 bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Design system</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Reusable UI foundation</h1>
          <p className="mt-3 max-w-2xl text-lg text-[color:var(--muted)]">
            Typography, color, spacing, buttons, cards, nav, tables, modals, toasts, loading states, and dark mode patterns are all defined here for fast product development.
          </p>
        </div>
        <DesignSystemPreview />
      </div>
    </main>
  );
}
