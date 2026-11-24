import { clsx } from "clsx";

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <As className={clsx("card", className)}>{children}</As>;
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-white/60">{sub}</p>}
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-5">
      {kicker && (
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-400">{kicker}</p>
      )}
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-white/60">{description}</p>}
    </header>
  );
}
