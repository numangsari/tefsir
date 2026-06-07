import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { BrandMark } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Ana sayfa için site adının kendisi başlık olsun (template'i atla)
  title: "tefsir.net — Kur'an-ı Kerim'i 11 klasik tefsirle okuyun",
  description:
    "Kur'an-ı Kerim'i 11 klasik Türkçe tefsir üzerinden ayet ayet okuyun. Günümüz Türkçesine sadeleştirilmiş metin, kelime kelime meal, vurgu ve not alma ile anlayarak okuma.",
  alternates: { canonical: "/" },
};

type Feature = {
  href: string;
  title: string;
  desc: string;
  icon: string;
  guestNote?: string;
};

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role;
  const isGuest = !user;

  const features: Feature[] = [
    {
      href: "/oku",
      title: "Tefsir Oku",
      desc: "11 klasik tefsiri ayet ayet, sadeleştirilmiş ve anlaşılır biçimde okuyun.",
      icon: "📖",
    },
    {
      href: "/arama",
      title: "Arama",
      desc: "Sûre, meal, tefsir metni ve notlarınız içinde tam metin arama yapın.",
      icon: "⌕",
    },
    {
      href: isGuest ? "/giris?tab=kayit" : "/panel",
      title: "Notlarım",
      desc: "Ayetlerde önemli yerleri vurgulayın, kendi notlarınızı tutun.",
      icon: "✎",
      guestNote: isGuest ? "Üyelik gerekir" : undefined,
    },
    {
      href: isGuest ? "/giris" : "/profil",
      title: "Hesabım",
      desc: "Hesap bilgilerinizi yönetin, okuma ilerlemenizi takip edin.",
      icon: "👤",
      guestNote: isGuest ? "Üyelik gerekir" : undefined,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        userName={user?.name ?? user?.email ?? undefined}
        role={role}
        isGuest={isGuest}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center animate-fade-up">
            <div className="flex items-center justify-center gap-3 mb-7">
              <BrandMark className="h-14 w-14 shrink-0 drop-shadow-[0_4px_20px_rgba(16,185,129,0.45)]" />
              <span className="font-serif text-4xl md:text-5xl font-bold tracking-tight leading-none">
                <span className="text-stone-800 dark:text-white">tefsir</span>
                <span className="text-emerald-600 dark:text-amber-300">.net</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-stone-800 dark:text-stone-50">
              Kur&apos;an-ı Kerim&apos;i{" "}
              <span className="text-emerald-600 dark:text-amber-300">11 klasik tefsir</span> ile okuyun
            </h1>
            <p className="mt-5 text-base md:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
              Taberî&apos;den Kurtubî&apos;ye, Fahreddin Râzî&apos;den İbn Kesîr&apos;e — klasik
              tefsirleri ayet ayet, günümüz Türkçesine sadeleştirilmiş ve anlaşılır biçimde
              okuyun. Kelime kelime meal, vurgulama ve not alma ile anlayarak okuma.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/oku" className="px-6 py-3 btn-glow">
                Tefsir Oku
              </Link>
              {isGuest ? (
                <Link href="/giris?tab=kayit" className="px-6 py-3 btn-outline-glow">
                  Ücretsiz üye ol
                </Link>
              ) : (
                <Link href="/panel" className="px-6 py-3 btn-outline-glow">
                  Notlarım
                </Link>
              )}
            </div>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              Üye olmadan da okuyabilirsiniz; not ve vurgu için ücretsiz hesap oluşturun.
            </p>
          </div>
        </section>

        {/* Özellik kartları */}
        <section className="mx-auto max-w-4xl px-4 py-14">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-800 dark:text-stone-100 text-center mb-8">
            Sitede neler yapabilirsiniz?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group surface-glass surface-glass-hover p-5 animate-fade-up"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-lg shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)]"
                    aria-hidden
                  >
                    {f.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {f.title}
                      </h3>
                      {f.guestNote && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shadow-[0_0_12px_-3px_rgba(245,158,11,0.5)]">
                          {f.guestNote}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Nasıl çalışır / iletişim */}
        <section className="mx-auto max-w-4xl px-4 pb-16">
          <div className="surface-glass p-6 md:p-8 text-center">
            <h2 className="text-lg md:text-xl font-semibold text-emerald-800 dark:text-emerald-200">
              Bir sorunuz ya da öneriniz mi var?
            </h2>
            <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-300/80 max-w-xl mx-auto">
              Görüş, öneri ve hata bildirimleriniz için bize ulaşabilirsiniz. Her geri bildirim
              siteyi daha iyi hale getirmemize yardımcı olur.
            </p>
            <Link href="/iletisim" className="inline-flex mt-5 px-5 py-2.5 btn-glow">
              İletişime geç
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 dark:border-white/10 py-6">
        <div className="mx-auto max-w-4xl px-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-stone-500 dark:text-stone-400">
          <Link href="/oku" className="hover:text-emerald-700 dark:hover:text-emerald-300">
            Tefsir Oku
          </Link>
          <Link href="/sureler" className="hover:text-emerald-700 dark:hover:text-emerald-300">
            Sûreler
          </Link>
          <Link href="/arama" className="hover:text-emerald-700 dark:hover:text-emerald-300">
            Arama
          </Link>
          <Link href="/iletisim" className="hover:text-emerald-700 dark:hover:text-emerald-300">
            İletişim
          </Link>
          <span className="text-stone-400 dark:text-stone-600">
            © {new Date().getFullYear()} tefsir.net
          </span>
        </div>
      </footer>
    </div>
  );
}
