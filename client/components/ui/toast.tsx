"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, Check, Info, X, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/button";

/**
 * Transient feedback for the outcome of an action the user just took.
 *
 * This is a presentation surface only. It deliberately knows nothing about §17
 * notification delivery — email, WhatsApp and in-app are a backend concern, and
 * coupling this to a provider would mean one component deciding business rules.
 *
 * Errors are announced assertively, everything else politely: a failed save needs
 * interrupting, a saved confirmation does not.
 */

export type ToastTone = "neutral" | "success" | "warning" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed by hand. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: string;
  description?: string;
}

type ToastInput = string | ToastOptions;

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const DEFAULT_DURATIONS: Record<ToastTone, number> = {
  neutral: 4000,
  success: 3500,
  warning: 6000,
  // Errors stay until acknowledged — a timeout would hide the failure the user
  // needs to act on.
  error: 0,
};

const TONE_STYLES: Record<ToastTone, string> = {
  neutral: "border-line bg-surface text-ink",
  success: "border-success/40 bg-surface text-ink",
  warning: "border-caution/40 bg-surface text-ink",
  error: "border-danger/50 bg-surface text-ink",
};

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  neutral: <Info className="size-4 text-ink-muted" aria-hidden="true" />,
  success: <Check className="size-4 text-success" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4 text-caution" aria-hidden="true" />,
  error: <AlertCircle className="size-4 text-danger" aria-hidden="true" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, number>());
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));

    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const schedule = useCallback(
    (id: string, duration: number) => {
      const existing = timersRef.current.get(id);
      if (existing !== undefined) window.clearTimeout(existing);
      if (duration <= 0) return;

      timersRef.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  const toast = useCallback(
    (input: ToastInput) => {
      const options: ToastOptions = typeof input === "string" ? { title: input } : input;
      const tone = options.tone ?? "neutral";
      const duration = options.duration ?? DEFAULT_DURATIONS[tone];

      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      const item: ToastItem = { id, tone, duration, title: options.title, description: options.description };

      setToasts((current) => {
        const next = [...current, item];
        // Drop the oldest rather than letting the stack grow off-screen.
        return next.slice(-MAX_VISIBLE);
      });

      schedule(id, duration);
    },
    [schedule],
  );

  // Clear pending timers if the provider unmounts mid-countdown.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} onPause={schedule} />
    </ToastContext.Provider>
  );
}

/**
 * Announce-and-render surface. Must stay mounted for live-region updates to be
 * read, so it lives inside the provider rather than in the pages that toast.
 */
function ToastViewport({
  toasts,
  onDismiss,
  onPause,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onPause: (id: string, duration: number) => void;
}) {
  return (
    /*
     * The container is deliberately not itself a live region. Flipping `aria-live`
     * between polite and assertive on an already-mounted node is announced
     * unreliably, so each toast carries its own role instead: `alert` interrupts
     * for failures, `status` waits its turn for everything else.
     */
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          /*
           * Pausing on hover or focus gives a screen-reader user the same chance
           * to read the message as a mouse user; the timer resumes on leave.
           */
          onMouseEnter={() => onPause(item.id, 0)}
          onMouseLeave={() => onPause(item.id, item.duration)}
          onFocusCapture={() => onPause(item.id, 0)}
          onBlurCapture={() => onPause(item.id, item.duration)}
          className={[
            "pointer-events-auto flex w-full max-w-sm items-start gap-3",
            "rounded-sm border px-4 py-3",
            "shadow-[0_4px_16px_-6px_rgba(25,25,25,0.20)]",
            "animate-[toast-in_150ms_ease-out] motion-reduce:animate-none",
            TONE_STYLES[item.tone],
          ].join(" ")}
        >
          <span className="mt-px shrink-0">{TONE_ICONS[item.tone]}</span>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-[18px] font-medium">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-[13px] leading-[18px] text-ink-muted">{item.description}</p>
            ) : null}
          </div>

          <Button
            variant="tertiary"
            size="sm"
            onClick={() => onDismiss(item.id)}
            aria-label={`Dismiss: ${item.title}`}
            className="-mt-1 -mr-2 size-7 shrink-0 p-0"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/** Returns `null` when no provider is mounted, so a page cannot crash on it. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      dismiss: () => {},
    };
  }
  return context;
}

export default ToastProvider;
