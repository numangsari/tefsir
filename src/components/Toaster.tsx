"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type Ctx = {
  push: (msg: string, kind?: ToastKind) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  confirm: (msg: string) => Promise<boolean>;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <Toaster />");
  return ctx;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (v: boolean) => void;
  } | null>(null);

  const remove = useCallback((id: number) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "info") => {
      counter.current += 1;
      const id = counter.current;
      setToasts((xs) => [...xs, { id, kind, message }]);
      window.setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const ctx: Ctx = {
    push,
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
    confirm,
  };

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-md shadow-lg px-4 py-2 text-sm border max-w-sm animate-toast ${
              t.kind === "success"
                ? "bg-emerald-700 text-white border-emerald-600"
                : t.kind === "error"
                ? "bg-red-700 text-white border-red-600"
                : "bg-stone-800 text-white border-stone-700"
            }`}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden>
                {t.kind === "success" ? "✓" : t.kind === "error" ? "✕" : "ⓘ"}
              </span>
              <span>{t.message}</span>
            </div>
          </div>
        ))}
      </div>
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onResult={(v) => {
            confirmState.resolve(v);
            setConfirmState(null);
          }}
        />
      )}
    </ToastCtx.Provider>
  );
}

function ConfirmDialog({
  message,
  onResult,
}: {
  message: string;
  onResult: (v: boolean) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onResult(false);
      else if (e.key === "Enter") onResult(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onResult]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4"
      onClick={() => onResult(false)}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm p-5 border border-stone-200 dark:border-stone-700"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-stone-800 dark:text-stone-100 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onResult(false)}
            className="px-3 py-1.5 text-sm rounded border border-stone-300 dark:border-stone-700"
          >
            İptal
          </button>
          <button
            onClick={() => onResult(true)}
            className="px-3 py-1.5 text-sm rounded bg-red-700 text-white hover:bg-red-800"
            autoFocus
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
}
