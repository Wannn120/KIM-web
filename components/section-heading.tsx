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
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">{eyebrow}</p>
      <h2 id={id} className={`mt-2 text-3xl font-semibold sm:text-4xl ${titleClassName}`}>
        {title}
      </h2>
    </div>
  );
}
