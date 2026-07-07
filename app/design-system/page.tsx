import { DesignSystemPreview } from "@/components/design-system";

export const dynamic = "force-dynamic";

export default function DesignSystemPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Design system</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Reusable UI foundation</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-400">
            Typography, color, spacing, buttons, cards, nav, tables, modals, toasts, loading states, and dark mode patterns are all defined here for fast product development.
          </p>
        </div>
        <DesignSystemPreview />
      </div>
    </main>
  );
}
