"use client";

import { useEffect, useState } from "react";
import type { ContactMessage } from "./types";
import { Card, Spinner } from "./ui";
import { useToast } from "@/components/Toaster";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IletisimTab() {
  const toast = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/contact", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { unread: number; messages: ContactMessage[] };
      setMessages(data.messages);
      setUnread(data.unread);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleRead(m: ContactMessage) {
    const read = m.readAt ? 0 : 1;
    setBusy(m.id);
    const res = await fetch(`/api/admin/contact?id=${m.id}&read=${read}`, { method: "PATCH" });
    setBusy(null);
    if (res.ok) {
      setMessages((xs) =>
        xs.map((x) => (x.id === m.id ? { ...x, readAt: read ? new Date().toISOString() : null } : x))
      );
      setUnread((u) => Math.max(0, u + (read ? -1 : 1)));
    } else {
      toast.error("İşlem başarısız.");
    }
  }

  function openReply(m: ContactMessage) {
    if (replyFor === m.id) {
      setReplyFor(null);
      return;
    }
    setReplyFor(m.id);
    setReplyText("");
  }

  async function sendReply(m: ContactMessage) {
    if (!replyText.trim()) {
      toast.error("Yanıt metni boş olamaz.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/admin/contact/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, body: replyText }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (res.ok) {
      toast.success(`Yanıt ${m.email} adresine gönderildi.`);
      if (!m.readAt) setUnread((u) => Math.max(0, u - 1));
      setMessages((xs) =>
        xs.map((x) => (x.id === m.id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x))
      );
      setReplyFor(null);
      setReplyText("");
    } else {
      toast.error(data.error || "Yanıt gönderilemedi.");
    }
  }

  async function remove(m: ContactMessage) {
    if (!(await toast.confirm("Bu mesajı kalıcı olarak silmek istiyor musunuz?"))) return;
    setBusy(m.id);
    const res = await fetch(`/api/admin/contact?id=${m.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setMessages((xs) => xs.filter((x) => x.id !== m.id));
      if (!m.readAt) setUnread((u) => Math.max(0, u - 1));
      toast.success("Mesaj silindi.");
    } else {
      toast.error("Silme başarısız.");
    }
  }

  if (loading && messages.length === 0) return <Spinner />;

  return (
    <Card
      title={`İletişim mesajları (${messages.length}${unread > 0 ? ` · ${unread} okunmamış` : ""})`}
    >
      {messages.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Henüz iletişim mesajı yok. Ziyaretçilerin /iletisim sayfasından gönderdiği mesajlar
          burada listelenir.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {messages.map((m) => {
            const isUnread = !m.readAt;
            return (
              <li key={m.id} className="py-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${
                      isUnread ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"
                    }`}
                    aria-label={isUnread ? "okunmamış" : "okundu"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-stone-800 dark:text-stone-100"
                            : "text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {m.name}
                      </span>
                      <a
                        href={`mailto:${m.email}`}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {m.email}
                      </a>
                      {m.userId && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                          üye
                        </span>
                      )}
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                    {m.subject && (
                      <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mt-0.5">
                        {m.subject}
                      </div>
                    )}
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 whitespace-pre-wrap break-words">
                      {m.body}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <button
                        onClick={() => toggleRead(m)}
                        disabled={busy === m.id}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50"
                      >
                        {isUnread ? "Okundu işaretle" : "Okunmadı işaretle"}
                      </button>
                      <button
                        onClick={() => openReply(m)}
                        className="text-stone-500 dark:text-stone-400 hover:underline"
                      >
                        {replyFor === m.id ? "Yanıtı kapat" : "Yanıtla"}
                      </button>
                      <button
                        onClick={() => remove(m)}
                        disabled={busy === m.id}
                        className="text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>

                    {replyFor === m.id && (
                      <div className="mt-3 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                          Yanıt <span className="font-medium">{m.email}</span> adresine{" "}
                          <span className="font-medium">tefsir.net</span> adına gönderilecek.
                        </p>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength={5000}
                          rows={4}
                          autoFocus
                          placeholder="Yanıtınızı yazın…"
                          className="w-full rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-y"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => sendReply(m)}
                            disabled={sending}
                            className="px-3 py-1.5 text-xs rounded-md bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-60"
                          >
                            {sending ? "Gönderiliyor…" : "Gönder"}
                          </button>
                          <button
                            onClick={() => setReplyFor(null)}
                            disabled={sending}
                            className="px-3 py-1.5 text-xs rounded-md border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 disabled:opacity-60"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
