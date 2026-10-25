"use client";

import { useSyncExternalStore } from "react";
import { formatRemaining } from "@/lib/format";

// Um único relógio compartilhado por todos os contadores da página.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
  listeners.add(cb);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
const nowSec = () => Math.floor(Date.now() / 1000);

/** Tempo restante ao vivo. No servidor mostra só um traço (evita divergência de hidratação). */
export function Countdown({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const now = useSyncExternalStore(subscribe, nowSec, () => null);
  const text = now === null ? "—" : formatRemaining(new Date(expiresAt).getTime() - now * 1000);
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
