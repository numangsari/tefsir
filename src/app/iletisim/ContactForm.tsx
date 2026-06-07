"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toaster";

export function ContactForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const toast = useToast();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim() || !email.trim() || !body.trim()) {
      toast.error("Ad, e-posta ve mesaj alanları zorunludur.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, body, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      setSent(true);
      setSubject("");
      setBody("");
      toast.success("Mesajınız iletildi. Teşekkürler!");
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="surface-glass p-6 text-center">
        <div className="text-3xl mb-2" aria-hidden>
          ✓
        </div>
        <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
          Mesajınız iletildi
        </h2>
        <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
          Geri bildiriminiz için teşekkür ederiz. En kısa sürede size dönüş yapacağız.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setSent(false)}
            className="px-4 py-2 text-sm btn-outline-glow"
          >
            Yeni mesaj gönder
          </button>
          <Link href="/oku" className="px-4 py-2 text-sm btn-glow">
            Tefsir Oku
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Adınız" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            className={inputCls}
            placeholder="Adınız"
          />
        </Field>
        <Field label="E-posta" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={160}
            required
            className={inputCls}
            placeholder="ornek@eposta.com"
          />
        </Field>
      </div>

      <Field label="Konu">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
          className={inputCls}
          placeholder="İsteğe bağlı"
        />
      </Field>

      <Field label="Mesajınız" required>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          required
          rows={6}
          className={`${inputCls} resize-y`}
          placeholder="Mesajınızı buraya yazın…"
        />
      </Field>

      {/* Honeypot — gerçek kullanıcılar görmez/doldurmaz */}
      <div className="hidden" aria-hidden>
        <label>
          Web siteniz
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-6 py-2.5 btn-glow disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Gönderiliyor…" : "Mesajı Gönder"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/60 px-3 py-2 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
