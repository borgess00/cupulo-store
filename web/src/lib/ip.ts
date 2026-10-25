import "server-only";
import { createHmac } from "node:crypto";

/** IP do cliente atrás do proxy da Vercel. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "desconhecido";
}

/** Guardamos só o hash do IP (LGPD). */
export function hashIp(ip: string): string {
  return createHmac("sha256", process.env.KEY_PEPPER ?? "sem-pepper").update(`ip:${ip}`).digest("hex").slice(0, 32);
}
