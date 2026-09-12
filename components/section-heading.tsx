interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  id?: string;
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({ eyebrow, title, id, className = "", titleClassName = "text-[color:var(--foreground)]" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">{eyebrow}</p>
      <h2 id={id} className={`mt-2 text-balance text-2xl font-semibold leading-tight sm:text-3xl ${titleClassName}`}>
        {title}
      </h2>
    </div>
  );
}
