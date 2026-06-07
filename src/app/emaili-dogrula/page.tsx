"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResendForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = (await r.json()) as { ok?: boolean; emailError?: boolean };
      setState(d.ok && !d.emailError ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-3">
        Yeni doğrulama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="mt-4 space-y-2">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        E-posta adresinizi girin, yeni bir doğrulama bağlantısı gönderelim:
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ornek@eposta.com"
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
      />
      {state === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">
          E-posta gönderilemedi. Lütfen tekrar deneyin.
        </p>
      )}
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full bg-emerald-700 text-white px-4 py-2 rounded-md hover:bg-emerald-800 text-sm disabled:opacity-50"
      >
        {state === "loading" ? "Gönderiliyor…" : "Yeni doğrulama bağlantısı gönder"}
      </button>
    </form>
  );
}

function Content() {
  const params = useSearchParams();
  const status = params.get("status");

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
          E-posta doğrulandı
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Hesabınız aktifleştirildi. Şimdi giriş yapabilirsiniz.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 bg-emerald-700 text-white px-6 py-2.5 rounded-md hover:bg-emerald-800"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl">⚠</div>
          <h1 className="mt-3 text-2xl font-semibold text-amber-700 dark:text-amber-300">
            Bağlantı süresi doldu
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Doğrulama bağlantısı geçersiz veya 24 saatlik süresi dolmuş.
          </p>
        </div>
        <ResendForm />
        <p className="text-center text-xs text-stone-400 dark:text-stone-500">
          Hiç kayıt olmadıysanız{" "}
          <Link href="/kayit" className="text-emerald-700 dark:text-emerald-400 hover:underline">
            yeniden kayıt olun
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">✉</div>
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
        E-postanızı kontrol edin
      </h1>
      <p className="text-stone-600 dark:text-stone-400">
        Kayıt olduğunuz e-posta adresine bir doğrulama bağlantısı gönderdik.
        Bağlantıya tıklayarak hesabınızı aktifleştirin.
      </p>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Gelen kutunuzda görmüyorsanız spam klasörünü kontrol edin.
      </p>
      <ResendForm />
      <Link href="/" className="block text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
        Giriş sayfasına dön
      </Link>
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8">
        <Suspense>
          <Content />
        </Suspense>
      </div>
    </main>
  );
}
