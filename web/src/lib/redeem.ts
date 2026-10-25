import "server-only";
import type { KeyDuration } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { applyKeyGrant } from "@/lib/access";
import { DURATIONS } from "@/lib/durations";
import { hashKey, normalizeKey } from "@/lib/keys";

export type RedeemErrorCode = "INVALID" | "ALREADY_USED" | "ALREADY_USED_BY_YOU" | "REVOKED";

export const REDEEM_MESSAGES: Record<RedeemErrorCode, string> = {
  INVALID: "Key inválida. Confira se digitou certinho no formato CUPULO-XXXX-XXXX-XXXX.",
  ALREADY_USED: "Esta key já foi usada por outra conta.",
  ALREADY_USED_BY_YOU: "Você já resgatou esta key. O produto está na sua biblioteca.",
  REVOKED: "Esta key foi revogada. Fale com a staff no Discord.",
};

export type RedeemResult =
  | {
      ok: true;
      product: { id: string; slug: string; name: string };
      duration: KeyDuration;
      lifetime: boolean;
      expiresAt: Date | null;
    }
  | { ok: false; code: RedeemErrorCode };

/**
 * Resgata uma key para o usuário, tudo numa transação:
 * 1. "reivindica" a key (UPDATE … WHERE status = AVAILABLE) — só um resgate vence;
 * 2. registra o resgate;
 * 3. soma o tempo no acesso (linha travada).
 */
export async function redeemKey(userId: string, rawKey: string): Promise<RedeemResult> {
  const canonical = normalizeKey(rawKey);
  if (!canonical) return { ok: false, code: "INVALID" };
  const keyHash = hashKey(canonical);

  return db.$transaction(async (tx) => {
    const key = await tx.key.findUnique({
      where: { keyHash },
      include: { product: { select: { id: true, slug: true, name: true } }, redemption: { select: { userId: true } } },
    });
    if (!key) return { ok: false, code: "INVALID" } as const;
    if (key.status === "REVOKED") return { ok: false, code: "REVOKED" } as const;
    if (key.status === "REDEEMED") {
      return { ok: false, code: key.redemption?.userId === userId ? "ALREADY_USED_BY_YOU" : "ALREADY_USED" } as const;
    }

    const claimed = await tx.key.updateMany({
      where: { id: key.id, status: "AVAILABLE" },
      data: { status: "REDEEMED" },
    });
    if (claimed.count !== 1) {
      // Outro resgate (ou revogação) chegou primeiro.
      const now = await tx.key.findUnique({ where: { id: key.id }, include: { redemption: { select: { userId: true } } } });
      if (now?.status === "REVOKED") return { ok: false, code: "REVOKED" } as const;
      return { ok: false, code: now?.redemption?.userId === userId ? "ALREADY_USED_BY_YOU" : "ALREADY_USED" } as const;
    }

    const days = DURATIONS[key.duration].days;
    await tx.redemption.create({
      data: { keyId: key.id, userId, productId: key.productId, daysGranted: days },
    });
    const access = await applyKeyGrant(tx, userId, key.productId, days);

    return {
      ok: true,
      product: key.product,
      duration: key.duration,
      lifetime: access.lifetime,
      expiresAt: access.lifetime ? null : access.expiresAt,
    } as const;
  });
}
