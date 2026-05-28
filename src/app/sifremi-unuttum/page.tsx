"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.status === 429) {
      setError("Çok fazla istek. Lütfen 15 dakika sonra tekrar deneyin.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✉</div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
              E-posta gönderildi
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              Eğer bu adrese kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.
              Bağlantı 1 saat geçerlidir.
            </p>
            <Link href="/" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-2">
              Şifremi unuttum
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 text-white py-2.5 rounded-md hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm">
              <Link href="/" className="text-emerald-700 dark:text-emerald-400 hover:underline">
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
