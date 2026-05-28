"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Bir hata oluştu.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8">
        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✓</div>
            <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
              Şifreniz güncellendi
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              Yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 bg-emerald-700 text-white px-6 py-2.5 rounded-md hover:bg-emerald-800"
            >
              Giriş yap
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-2">
              Yeni şifre belirle
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              En az 6 karakter içeren yeni şifrenizi girin.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Yeni şifre</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Şifre tekrarı</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-800 ${
                    password2 && password !== password2
                      ? "border-red-500 dark:border-red-400"
                      : "border-stone-300 dark:border-stone-700"
                  }`}
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 text-white py-2.5 rounded-md hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? "Kaydediliyor..." : "Şifremi güncelle"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
