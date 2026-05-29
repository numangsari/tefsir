"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AuthTab = "giris" | "kayit";

type RandomAyah = {
  surahId: number;
  surahName: string;
  number: number;
  arabic: string;
  meal: string;
};

export function AuthUnified({ defaultTab = "giris" }: { defaultTab?: AuthTab }) {
  const params = useSearchParams();
  const tabFromQuery = params.get("tab") === "kayit" ? "kayit" : "giris";
  const [tab, setTab] = useState<AuthTab>(tabFromQuery ?? defaultTab);
  const [ayah, setAyah] = useState<RandomAyah | null>(null);

  useEffect(() => {
    setTab(tabFromQuery ?? defaultTab);
  }, [tabFromQuery, defaultTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/random-ayah", { cache: "no-store" });
        if (r.ok && !cancelled) setAyah((await r.json()) as RandomAyah);
      } catch {
        // Sessizce devam et.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      <section className="bg-emerald-700 dark:bg-emerald-950 text-emerald-50 p-8 md:p-12 flex flex-col overflow-y-auto">
        <div className="max-w-md mx-auto w-full my-auto">
          {ayah ? (
            <>
              <div className="arabic text-white mb-3 leading-[3rem]">{ayah.arabic}</div>
              <div className="text-sm text-emerald-100 mb-3 text-center font-semibold tracking-wide bg-emerald-800/40 dark:bg-emerald-900/40 rounded-md py-1">
                {ayah.surahName} Sûresi · {ayah.number}. ayet
              </div>
              <p className="text-emerald-50/95 text-base leading-relaxed">{ayah.meal}</p>
            </>
          ) : (
            <div className="text-emerald-200/70">Yükleniyor…</div>
          )}
        </div>
      </section>

      <section className="p-8 md:p-12 flex flex-col justify-center bg-stone-50 dark:bg-stone-950">
        <div className="max-w-sm mx-auto w-full">
          <h1 className="text-3xl font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
            tefsir.net
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
            Hesabınla giriş yap veya yeni hesap oluştur.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setTab("giris")}
              className={`py-2 text-sm rounded border ${
                tab === "giris"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
              }`}
            >
              Giriş
            </button>
            <button
              onClick={() => setTab("kayit")}
              className={`py-2 text-sm rounded border ${
                tab === "kayit"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
              }`}
            >
              Kayıt
            </button>
          </div>

          {tab === "giris" ? <LoginForm /> : <RegisterForm />}

          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 text-center">
            <Link
              href="/oku"
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              Üye olmadan devam et →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = useMemo(() => params.get("callbackUrl") || "/oku", [params]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error.includes("EMAIL_NOT_VERIFIED")) {
        setError("E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.");
      } else {
        setError("E-posta veya şifre hatalı.");
      }
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">E-posta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm">Şifre</label>
          <Link
            href="/sifremi-unuttum"
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Şifremi unuttum
          </Link>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        />
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-2.5 rounded-md hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Giriliyor..." : "Giriş yap"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Kayıt başarısız.");
      return;
    }
    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl">✉</div>
        <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
          Hesabınız oluşturuldu. <strong>{email}</strong> adresine bir doğrulama bağlantısı
          gönderdik. Gelen kutunuzu kontrol edin.
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Spam klasörünü de kontrol etmeyi unutmayın.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">İsim (opsiyonel)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">E-posta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Şifre (en az 6 karakter)</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
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
          className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 ${
            password2 && password !== password2
              ? "border-red-500 dark:border-red-400"
              : "border-stone-300 dark:border-stone-700"
          }`}
        />
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-2.5 rounded-md hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Kaydediliyor..." : "Kayıt ol"}
      </button>
    </form>
  );
}
