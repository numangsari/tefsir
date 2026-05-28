"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
      <div className="text-center space-y-4">
        <div className="text-5xl">⚠</div>
        <h1 className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
          Bağlantı süresi doldu
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden kayıt olun.
        </p>
        <Link
          href="/?tab=kayit"
          className="inline-block mt-2 bg-emerald-700 text-white px-6 py-2.5 rounded-md hover:bg-emerald-800"
        >
          Yeniden kayıt ol
        </Link>
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
      <Link href="/" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
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
