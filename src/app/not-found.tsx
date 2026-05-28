import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] grid place-items-center px-6 py-16">
      <div className="text-center max-w-md">
        <p className="text-6xl font-semibold text-emerald-700 dark:text-emerald-300">404</p>
        <h1 className="mt-3 text-xl font-medium text-stone-800 dark:text-stone-100">
          Sayfa bulunamadı
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Aradığınız sayfa kaldırılmış, ismi değişmiş veya hiç var olmamış olabilir.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 text-sm"
          >
            Anasayfaya dön
          </Link>
          <Link
            href="/oku"
            className="px-4 py-2 rounded-md border border-emerald-700 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-sm"
          >
            Okumaya başla
          </Link>
        </div>
      </div>
    </main>
  );
}
