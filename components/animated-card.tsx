export function AnimatedCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-6 shadow-[0_20px_80px_rgba(16,185,129,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(16,185,129,0.16)] ${className}`}>
      {children}
    </div>
  );
}
