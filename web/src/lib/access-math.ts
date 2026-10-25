// Regras de tempo de acesso (puras, sem banco). Testadas em tests/access-math.test.ts.

export const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessState = {
  expiresAt: Date | null;
  lifetime: boolean;
};

export function isAccessActive(a: AccessState, now = new Date()): boolean {
  return a.lifetime || (a.expiresAt !== null && a.expiresAt.getTime() > now.getTime());
}

/** Soma dias: conta a partir de agora se já expirou, ou do fim atual se ainda vale. */
export function extendExpiry(current: Date | null, days: number, now = new Date()): Date {
  const base = current && current.getTime() > now.getTime() ? current : now;
  return new Date(base.getTime() + days * DAY_MS);
}

/** Remove os dias de uma key revogada. Nunca deixa uma data no futuro "inventada". */
export function shrinkExpiry(current: Date | null, days: number): Date | null {
  if (!current) return null;
  return new Date(current.getTime() - days * DAY_MS);
}

export type AccessStatus = "lifetime" | "active" | "expired";

export function accessStatus(a: AccessState, now = new Date()): AccessStatus {
  if (a.lifetime) return "lifetime";
  return isAccessActive(a, now) ? "active" : "expired";
}
