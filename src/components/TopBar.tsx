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
    <header className="bg-emerald-800 dark:bg-emerald-950 text-emerald-50 px-4 py-2 flex items-center justify-between text-sm gap-2">
      <Link href="/" aria-label="tefsir.net ana sayfa" className="whitespace-nowrap">
        <BrandLogo />
      </Link>

      <div className="hidden lg:block text-center text-emerald-100/90 text-base italic font-serif">
        “Sizin en hayırlınız, Kur&apos;an&apos;ı öğrenen ve öğretendir.”
      </div>

      {/* Geniş ekran navigasyonu */}
      <nav className="hidden md:flex items-center gap-2">
        <Link
          href="/arama"
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-emerald-700"
          aria-label="Arama"
          title="Arama"
        >
          <span className="text-2xl leading-none" aria-hidden>
            ⌕
          </span>
        </Link>
        <Link href="/oku" className="px-2 py-1 rounded hover:bg-emerald-700">
          Tefsir Oku
        </Link>
        {!isGuest && (
          <Link href="/panel" className="px-2 py-1 rounded hover:bg-emerald-700">
            Notlarım
          </Link>
        )}
        <Link href="/iletisim" className="px-2 py-1 rounded hover:bg-emerald-700">
          İletişim
        </Link>
        {!isGuest && (
          <Link href="/profil" className="px-2 py-1 rounded hover:bg-emerald-700">
            Hesabım
          </Link>
        )}
        {role === "ADMIN" && (
          <Link href="/yonetici" className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600">
            Yönetici
          </Link>
        )}
        <button
          onClick={toggle}
          className="px-2 py-1 rounded hover:bg-emerald-700"
          aria-label="Tema değiştir"
          title={theme === "dark" ? "Açık moda geç" : "Koyu moda geç"}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        {isGuest ? (
          <Link
            href="/giris"
            className="ml-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 font-medium"
          >
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
          className="px-2 py-1 rounded hover:bg-emerald-700"
          aria-label="Tema değiştir"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-2 py-1 rounded hover:bg-emerald-700 text-lg leading-none"
          aria-label="Menü"
          aria-expanded={open}
        >
          ☰
        </button>
        {open && (
          <div className="absolute right-3 top-12 z-30 bg-emerald-800 dark:bg-emerald-950 border border-emerald-700 rounded-md shadow-lg min-w-[180px] py-1">
            <div className="px-3 py-1.5 text-xs text-emerald-200/80 border-b border-emerald-700">
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
      className="block px-3 py-2 hover:bg-emerald-700"
    >
      {children}
    </Link>
  );
}
