"use client";

// Yönetici paneli ortak UI bileşenleri

export type TabDef<K extends string> = {
  key: K;
  label: string;
};

export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<K>[];
  active: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="border-b border-stone-200/70 dark:border-white/10 mb-6">
      <nav className="flex gap-1 -mb-px overflow-x-auto" role="tablist">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-amber-600 text-amber-700 dark:text-amber-300"
                  : "border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string | undefined;
  hint?: string;
}) {
  return (
    <div className="surface-glass !rounded-xl p-3">
      <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <div className="text-xl font-semibold text-stone-800 dark:text-stone-100 mt-1">
        {value === undefined
          ? "…"
          : typeof value === "number"
          ? value.toLocaleString("tr-TR")
          : value}
      </div>
      {hint && (
        <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{hint}</div>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  rightLabel,
  color = "amber",
}: {
  value: number;
  max: number;
  label?: string;
  rightLabel?: string;
  color?: "amber" | "emerald" | "sky";
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "sky"
      ? "bg-sky-500"
      : "bg-amber-500";

  return (
    <div>
      {(label || rightLabel) && (
        <div className="flex items-center justify-between text-xs mb-1">
          {label && <span className="text-stone-600 dark:text-stone-300">{label}</span>}
          {rightLabel && (
            <span className="text-stone-500 dark:text-stone-400 tabular-nums">
              {rightLabel}
            </span>
          )}
        </div>
      )}
      <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-[width]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-glass !rounded-xl p-4 ${className}`}>
      {title && (
        <h2 className="text-sm font-medium mb-3 text-stone-700 dark:text-stone-300">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// Bağımlılıksız SVG alan/çizgi grafiği (sparkline).
// data: y değerleri dizisi; yatayda eşit aralıklı, dikeyde min..max ölçeklenir.
export function SparkArea({
  data,
  color = "amber",
  height = 48,
}: {
  data: number[];
  color?: "amber" | "emerald" | "sky";
  height?: number;
}) {
  const W = 240;
  const H = height;
  const P = 2; // dikey iç boşluk
  if (data.length === 0) {
    return <div style={{ height }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const n = data.length;
  const xAt = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v: number) => H - P - ((v - min) / range) * (H - 2 * P);

  const pts = data.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
  const linePath = `M${pts.join(" L")}`;
  const areaPath = `M${xAt(0)},${H} L${pts.join(" L")} L${xAt(n - 1).toFixed(1)},${H} Z`;

  const stroke =
    color === "emerald"
      ? "stroke-emerald-500"
      : color === "sky"
      ? "stroke-sky-500"
      : "stroke-amber-500";
  const fill =
    color === "emerald"
      ? "fill-emerald-500/10"
      : color === "sky"
      ? "fill-sky-500/10"
      : "fill-amber-500/10";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      role="img"
      aria-hidden
    >
      <path d={areaPath} className={fill} />
      <path
        d={linePath}
        fill="none"
        className={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Spinner({ label = "Yükleniyor…" }: { label?: string }) {
  return (
    <div className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
      {label}
    </div>
  );
}
