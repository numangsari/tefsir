"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOutCompletely } from "@/lib/sign-out";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";
import { TAFSIRS } from "@/data/tafsirs";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_HINT,
  validatePasswordAgainstEmail,
} from "@/lib/password-policy";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  highlightCount: number;
  noteCount: number;
};

type SurahProgress = {
  surahId: number;
  nameTr: string;
  ayetCount: number;
  read: number;
  total: number;
  percent: number;
};

export default function ProfilePage() {
  const { update } = useSession();
  const toast = useToast();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Okuma ilerlemesi
  const [progress, setProgress] = useState<SurahProgress[] | null>(null);

  // Şifre değiştir
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Favori tefsirler
  const [favoriteTafsirIds, setFavoriteTafsirIds] = useState<Set<number>>(new Set());
  const [favLoading, setFavLoading] = useState(true);

  // Hesap silme
  const [delPw, setDelPw] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/my", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as Profile;
        setP(d);
        setName(d.name ?? "");
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/my/progress", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as { surahs: SurahProgress[] };
        setProgress(d.surahs);
      } else {
        setProgress([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/my/favorite-tafsirs", { cache: "no-store" });
      if (r.ok) {
        const d = (await r.json()) as { tafsirIds: number[] };
        setFavoriteTafsirIds(new Set(d.tafsirIds));
      }
      setFavLoading(false);
    })();
  }, []);

  async function toggleFavorite(tafsirId: number) {
    const isFav = favoriteTafsirIds.has(tafsirId);
    setFavoriteTafsirIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(tafsirId);
      else next.add(tafsirId);
      return next;
    });
    const r = await fetch("/api/my/favorite-tafsirs", {
      method: isFav ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tafsirId }),
    });
    if (!r.ok) {
      // Hata olursa geri al
      setFavoriteTafsirIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(tafsirId);
        else next.delete(tafsirId);
        return next;
      });
      toast.error("Kaydedilemedi.");
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/my", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (r.ok) {
      toast.success("İsim güncellendi.");
      await update();
      setP((x) => (x ? { ...x, name: name.trim() || null } : x));
    } else toast.error("Kaydedilemedi.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    if (next !== next2) {
      setPwErr("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (curr === next) {
      setPwErr("Yeni şifre mevcut şifrenizle aynı olamaz.");
      return;
    }
    if (p) {
      const passwordCheck = validatePasswordAgainstEmail(next, p.email);
      if (!passwordCheck.ok) {
        setPwErr(passwordCheck.error);
        return;
      }
    }
    setPwLoading(true);
    const r = await fetch("/api/my/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curr, newPassword: next }),
    });
    setPwLoading(false);
    if (r.ok) {
      toast.success("Şifre güncellendi.");
      setCurr("");
      setNext("");
      setNext2("");
    } else {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setPwErr(j.error || "Hata oluştu.");
    }
  }

  async function deleteAccount() {
    if (!delConfirm) return;
    setDelLoading(true);
    const r = await fetch("/api/my", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: delPw }),
    });
    setDelLoading(false);
    if (r.ok) {
      toast.success("Hesabınız silindi.");
      await signOutCompletely();
    } else {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || "Hesap silinemedi.");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-stone-500">Yükleniyor…</main>
    );
  }
  if (!p) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-red-600">
        Profil yüklenemedi.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-serif font-semibold text-emerald-700 dark:text-emerald-300">
        Hesabım
      </h1>

      {/* Özet */}
      <section className="surface-glass !rounded-xl p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-y-2 text-sm">
          <dt className="text-stone-500 dark:text-stone-400">E-posta</dt>
          <dd>{p.email}</dd>
          <dt className="text-stone-500 dark:text-stone-400">Üyelik tarihi</dt>
          <dd>{new Date(p.createdAt).toLocaleDateString("tr-TR")}</dd>
          <dt className="text-stone-500 dark:text-stone-400">Vurgu / Not</dt>
          <dd>
            {p.highlightCount} vurgu · {p.noteCount} not
          </dd>
        </dl>
      </section>

      {/* Okuma ilerlemesi */}
      <section className="surface-glass !rounded-xl p-5">
        <h2 className="font-medium mb-1 text-stone-800 dark:text-stone-100">
          Okuma ilerlemesi
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Bir tefsiri OKU ile işaretledikçe ilgili sûrenin ilerlemesi artar. Yüzde, o
          sûrede okuduğunuz tefsir metinlerinin toplam tefsir metinlerine oranıdır.
        </p>

        {progress === null ? (
          <p className="text-sm text-stone-400 dark:text-stone-500">Yükleniyor…</p>
        ) : progress.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Henüz okuma kaydınız yok.{" "}
            <Link href="/oku" className="text-emerald-700 dark:text-emerald-400 hover:underline">
              Tefsir okumaya başlayın →
            </Link>
          </p>
        ) : (
          <ul className="space-y-3.5">
            {progress.map((s) => (
              <li key={s.surahId}>
                <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
                  <Link
                    href={`/oku/${s.surahId}/1`}
                    className="font-medium text-stone-800 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 truncate"
                  >
                    {s.nameTr} Sûresi
                  </Link>
                  <span className="shrink-0 tabular-nums text-stone-500 dark:text-stone-400">
                    %{s.percent}
                    <span className="text-stone-400 dark:text-stone-500">
                      {" "}
                      · {s.read}/{s.total}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width]"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Favori Tefsirler */}
      <section className="surface-glass !rounded-xl p-5">
        <h2 className="font-medium mb-1 text-stone-800 dark:text-stone-100">
          Favori Tefsirler
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Seçtiğiniz tefsirler okuma ekranında listenin başına sabitlenir.
        </p>
        {favLoading ? (
          <p className="text-sm text-stone-400 dark:text-stone-500">Yükleniyor…</p>
        ) : (
          <ul className="space-y-1.5">
            {TAFSIRS.map((t) => {
              const isFav = favoriteTafsirIds.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(t.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${
                      isFav
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                        : "bg-white/60 dark:bg-stone-900/50 border-stone-200/70 dark:border-white/10 hover:border-emerald-400/60"
                    }`}
                  >
                    <span className={`text-base leading-none shrink-0 ${isFav ? "text-amber-400" : "text-stone-300 dark:text-stone-600"}`}>
                      {isFav ? "★" : "☆"}
                    </span>
                    <span>
                      <span className="font-medium text-stone-800 dark:text-stone-100">{t.name}</span>
                      <span className="text-stone-500 dark:text-stone-400 ml-1.5 text-xs">
                        {t.author}
                        {t.deathYearGregorian ? ` · ö. ${t.deathYearHijri}/${t.deathYearGregorian}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* İsim */}
      <section className="surface-glass !rounded-xl p-5">
        <h2 className="font-medium mb-3 text-stone-800 dark:text-stone-100">İsim</h2>
        <form onSubmit={saveName} className="flex gap-2 items-end">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsminiz"
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white/70 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
          <button
            type="submit"
            disabled={saving || (name.trim() === (p.name ?? "").trim())}
            className="px-4 py-2 text-sm btn-glow disabled:opacity-50"
          >
            {saving ? "..." : "Kaydet"}
          </button>
        </form>
      </section>

      {/* Şifre */}
      <section className="surface-glass !rounded-xl p-5">
        <h2 className="font-medium mb-3 text-stone-800 dark:text-stone-100">Şifre değiştir</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{PASSWORD_REQUIREMENTS_HINT}</p>
        <form onSubmit={changePassword} className="space-y-3 max-w-sm">
          <input
            type="password"
            value={curr}
            onChange={(e) => setCurr(e.target.value)}
            placeholder="Mevcut şifre"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white/70 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Yeni şifre"
            required
            minLength={PASSWORD_MIN_LENGTH}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white/70 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
          <input
            type="password"
            value={next2}
            onChange={(e) => setNext2(e.target.value)}
            placeholder="Yeni şifre (tekrar)"
            required
            minLength={PASSWORD_MIN_LENGTH}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white/70 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
          {pwErr && <p className="text-sm text-red-700 dark:text-red-400">{pwErr}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 text-sm btn-glow disabled:opacity-50"
          >
            {pwLoading ? "..." : "Şifreyi güncelle"}
          </button>
        </form>
      </section>

      {/* Çıkış */}
      <section className="surface-glass !rounded-xl p-5">
        <h2 className="font-medium mb-3 text-stone-800 dark:text-stone-100">Oturum</h2>
        <button
          type="button"
          onClick={() => void signOutCompletely()}
          className="px-4 py-2 text-sm btn-outline-glow"
        >
          Çıkış yap
        </button>
      </section>

      {/* Hesabı sil */}
      <section className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-5">
        <h2 className="font-medium mb-2 text-red-800 dark:text-red-300">
          Hesabı sil
        </h2>
        <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-3">
          Hesabınızı silerseniz tüm vurgularınız ve notlarınız da kalıcı olarak silinir. Bu işlem geri alınamaz.
        </p>
        <div className="space-y-3 max-w-sm">
          <input
            type="password"
            value={delPw}
            onChange={(e) => setDelPw(e.target.value)}
            placeholder="Şifrenizi onay için yazın"
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-stone-800 border-red-300 dark:border-red-900"
          />
          <label className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
            <input
              type="checkbox"
              checked={delConfirm}
              onChange={(e) => setDelConfirm(e.target.checked)}
            />
            Hesabımı ve tüm verilerimi kalıcı olarak silmek istediğimi onaylıyorum.
          </label>
          <button
            onClick={deleteAccount}
            disabled={!delConfirm || !delPw || delLoading}
            className="px-4 py-2 text-sm rounded bg-red-700 text-white disabled:opacity-50 hover:bg-red-800"
          >
            {delLoading ? "Siliniyor..." : "Hesabı kalıcı olarak sil"}
          </button>
        </div>
      </section>
    </main>
  );
}
