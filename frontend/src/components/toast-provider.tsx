"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { TOAST_EVENT, type ToastEventDetail } from "@/lib/toast-utils";

interface ToastItem extends ToastEventDetail {
  id: number;
}

const TONE_CLASSES: Record<ToastItem["type"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
};

/** Accessible application-wide notifications used by toast-utils. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;

      const id = ++nextId.current;
      setItems((current) => [...current, { ...detail, id }].slice(-4));
      const duration = detail.options?.duration ?? 4_000;
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    }

    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [dismiss]);

  return (
    <>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => (
          <section key={item.id} role={item.type === "error" ? "alert" : "status"} className={`pointer-events-auto rounded-xl border p-4 shadow-lg ${TONE_CLASSES[item.type]}`}>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                {item.options?.title && <p className="text-sm font-semibold">{item.options.title}</p>}
                <p className="text-sm">{item.message}</p>
                {item.options?.description && <p className="mt-1 text-xs opacity-80">{item.options.description}</p>}
                {item.options?.action && <button type="button" className="mt-2 text-xs font-semibold underline" onClick={item.options.action.onClick}>{item.options.action.label}</button>}
              </div>
              <button type="button" aria-label="Dismiss notification" className="rounded p-1 hover:bg-black/10" onClick={() => dismiss(item.id)}><X className="h-4 w-4" /></button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
