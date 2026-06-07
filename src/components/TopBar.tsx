"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { BrandLogo } from "./BrandLogo";

export function TopBar({
  userName,
  role,
  isGuest = false,
}: {
  userName?: string;
  role?: string;
  isGuest?: boolean;
}) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <header className="backdrop-blur-md bg-white/70 dark:bg-black/40 border-b border-stone-200/70 dark:border-white/10 text-stone-700 dark:text-emerald-50 px-4 py-2 flex items-center justify-between text-sm gap-2">
      <Link href="/" aria-label="tefsir.net ana sayfa" className="whitespace-nowrap">
        <BrandLogo />
      </Link>

      <div className="hidden lg:block text-center text-stone-500 dark:text-emerald-100/80 text-base italic font-serif">
        “Sizin en hayırlınız, Kur&apos;an&apos;ı öğrenen ve öğretendir.”
      </div>

      {/* Geniş ekran navigasyonu */}
      <nav className="hidden md:flex items-center gap-2">
        <Link
          href="/arama"
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-emerald-100 dark:hover:bg-white/10"
          aria-label="Arama"
          title="Arama"
        >
          <span className="text-2xl leading-none" aria-hidden>
            ⌕
          </span>
        </Link>
        <Link href="/oku" className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10">
          Tefsir Oku
        </Link>
        {!isGuest && (
          <Link href="/panel" className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10">
            Notlarım
          </Link>
        )}
        <Link href="/iletisim" className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10">
          İletişim
        </Link>
        {!isGuest && (
          <Link href="/profil" className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10">
            Hesabım
          </Link>
        )}
        {role === "ADMIN" && (
          <Link
            href="/yonetici"
            className="px-3 py-1 rounded-full bg-amber-500/90 text-amber-950 font-medium hover:bg-amber-400 shadow-[0_0_14px_-4px_rgba(245,158,11,0.6)] transition-colors"
          >
            Yönetici
          </Link>
        )}
        <button
          onClick={toggle}
          className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10"
          aria-label="Tema değiştir"
          title={theme === "dark" ? "Açık moda geç" : "Koyu moda geç"}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        {isGuest ? (
          <Link href="/giris" className="ml-1 px-4 py-1.5 btn-glow text-xs">
            Giriş yap
          </Link>
        ) : (
          <span className="opacity-80 ml-1 max-w-[160px] truncate">{userName}</span>
        )}
      </nav>

      {/* Mobil */}
      <div className="md:hidden flex items-center gap-2" ref={ref}>
        <button
          onClick={toggle}
          className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10"
          aria-label="Tema değiştir"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-white/10 text-lg leading-none"
          aria-label="Menü"
          aria-expanded={open}
        >
          ☰
        </button>
        {open && (
          <div className="absolute right-3 top-12 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-emerald-50 rounded-xl shadow-glow min-w-[180px] py-1">
            <div className="px-3 py-1.5 text-xs text-stone-500 dark:text-emerald-200/80 border-b border-stone-200 dark:border-white/10">
              {isGuest ? "Misafir" : userName}
            </div>
            <MobileLink href="/arama" onClick={() => setOpen(false)} aria-label="Arama">
              ⌕ Arama
            </MobileLink>
            <MobileLink href="/oku" onClick={() => setOpen(false)}>Tefsir Oku</MobileLink>
            {!isGuest && (
              <MobileLink href="/panel" onClick={() => setOpen(false)}>Notlarım</MobileLink>
            )}
            {!isGuest && (
              <MobileLink href="/profil" onClick={() => setOpen(false)}>Hesabım</MobileLink>
            )}
            <MobileLink href="/iletisim" onClick={() => setOpen(false)}>İletişim</MobileLink>
            {role === "ADMIN" && (
              <MobileLink href="/yonetici" onClick={() => setOpen(false)}>Yönetici</MobileLink>
            )}
            {isGuest && (
              <MobileLink href="/giris" onClick={() => setOpen(false)}>Giriş yap</MobileLink>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className="block px-3 py-2 hover:bg-emerald-100 dark:hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
