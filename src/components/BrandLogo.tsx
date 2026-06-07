/**
 * tefsir.net marka logosu — açık kitap işareti + kelime markası.
 * Üst çubukta (koyu yeşil zemin) kullanılır.
 */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className="h-7 w-7 shrink-0 drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]" />
      <span className="font-serif text-lg font-bold leading-none tracking-tight">
        <span className="text-stone-800 dark:text-white">tefsir</span>
        <span className="text-emerald-600 dark:text-amber-300">.net</span>
      </span>
    </span>
  );
}

/** Yalnızca işaret (kitap) — buton/ikon yerlerinde kullanılabilir. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#047857" />
      <rect x="2.5" y="2.5" width="27" height="27" rx="7.5" stroke="#FCD34D" strokeOpacity="0.35" />
      {/* açık kitabın iki sayfası */}
      <path
        d="M16 10.2c-2.1-1.35-4.8-1.85-7.5-1.4-.55.1-.95.58-.95 1.14v9.62c0 .67.59 1.18 1.25 1.07 2.3-.38 4.6.1 6.2 1.27V10.2Z"
        fill="#FEF3C7"
      />
      <path
        d="M16 10.2c2.1-1.35 4.8-1.85 7.5-1.4.55.1.95.58.95 1.14v9.62c0 .67-.59 1.18-1.25 1.07-2.3-.38-4.6.1-6.2 1.27V10.2Z"
        fill="#FEF3C7"
      />
      {/* sayfa satırları */}
      <g stroke="#047857" strokeWidth="0.9" strokeLinecap="round" opacity="0.6">
        <path d="M10 12.4c1.4-.2 2.8-.05 3.8.45" />
        <path d="M10 14.6c1.4-.2 2.8-.05 3.8.45" />
        <path d="M22 12.4c-1.4-.2-2.8-.05-3.8.45" />
        <path d="M22 14.6c-1.4-.2-2.8-.05-3.8.45" />
      </g>
      {/* sırt */}
      <path d="M16 10.2v11.77" stroke="#FCD34D" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
