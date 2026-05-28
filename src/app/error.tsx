"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[80vh] grid place-items-center px-6 py-16">
      <div className="text-center max-w-md">
        <p className="text-6xl font-semibold text-red-700 dark:text-red-400">!</p>
        <h1 className="mt-3 text-xl font-medium text-stone-800 dark:text-stone-100">
          Beklenmeyen bir hata oluştu
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Lütfen tekrar deneyin. Sorun devam ediyorsa anasayfaya dönün.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] text-stone-400 font-mono">
            Hata kimliği: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 text-sm"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md border border-stone-300 dark:border-stone-700 text-sm"
          >
            Anasayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
