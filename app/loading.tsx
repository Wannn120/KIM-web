export default function Loading() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
        <div className="h-10 rounded-3xl bg-[color:var(--surface)]" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 rounded-[2rem] bg-[color:var(--surface)]" />
          <div className="space-y-6 lg:col-span-2">
            <div className="h-20 rounded-[2rem] bg-[color:var(--surface)]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-40 rounded-[2rem] bg-[color:var(--surface)]" />
              <div className="h-40 rounded-[2rem] bg-[color:var(--surface)]" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 rounded-[2rem] bg-[color:var(--surface)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
