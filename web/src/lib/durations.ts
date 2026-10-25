// Durações das keys. Arquivo puro: usado no servidor, no navegador e nos testes.
import type { KeyDuration } from "@/generated/prisma/enums";

export const DURATIONS: Record<KeyDuration, { days: number | null; label: string; api: string }> = {
  DAYS_7: { days: 7, label: "7 dias", api: "7d" },
  DAYS_30: { days: 30, label: "30 dias", api: "30d" },
  LIFETIME: { days: null, label: "Vitalícia", api: "lifetime" },
};

export const DURATION_KEYS = Object.keys(DURATIONS) as KeyDuration[];

/** Aceita "7d", "30d", "lifetime", "vitalicia" ou o enum ("DAYS_7"). */
export function parseDuration(value: string): KeyDuration | null {
  const v = value.trim().toLowerCase();
  if (v === "7d" || v === "7" || v === "days_7") return "DAYS_7";
  if (v === "30d" || v === "30" || v === "days_30") return "DAYS_30";
  if (v === "lifetime" || v === "vitalicia" || v === "vitalícia") return "LIFETIME";
  return null;
}

export function durationLabel(d: KeyDuration): string {
  return DURATIONS[d].label;
}
