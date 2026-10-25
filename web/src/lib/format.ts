// Formatação em pt-BR, sempre no fuso de Brasília (o servidor roda em UTC).
const TZ = "America/Sao_Paulo";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(new Date(d)).replace(",", " às");
}

export function formatBytes(bytes: number | bigint) {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** "12d 04h 33m" / "04h 33m 10s" a partir de milissegundos restantes. */
export function formatRemaining(ms: number) {
  if (ms <= 0) return "Expirado";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
}

export const PLATFORM_LABEL: Record<string, string> = {
  ANDROID: "Android",
  IOS: "iPhone",
  EMULADOR: "Emulador",
  MOBILADOR: "Mobilador",
  MULTI: "Multiplataforma",
};
