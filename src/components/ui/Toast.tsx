import { useEffect } from "react";
import {
  useToastStore,
  type ToastItem,
  type ToastKind,
} from "@/store/toastStore";
import { cn } from "@/utils/cn";
import { XIcon } from "./icons";

const KIND_STYLES: Record<ToastKind, { bar: string; icon: string }> = {
  info: { bar: "bg-sky-500", icon: "ℹ" },
  success: { bar: "bg-emerald-500", icon: "✓" },
  warning: { bar: "bg-amber-500", icon: "!" },
  error: { bar: "bg-rose-500", icon: "✕" },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), 4600);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);

  const style = KIND_STYLES[toast.kind];

  return (
    <div className="glass-strong pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl p-3 animate-fade-in">
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          style.bar
        )}
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-slate-100">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-snug text-slate-400">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="text-slate-500 transition-colors hover:text-slate-200"
        aria-label="Dismiss"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[1000] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
