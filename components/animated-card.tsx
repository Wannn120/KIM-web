export function AnimatedCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(6,182,212,0.15)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(34,211,238,0.2)] ${className}`}>
      {children}
    </div>
  );
}
