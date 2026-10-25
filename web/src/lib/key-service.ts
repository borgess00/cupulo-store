import "server-only";
import { randomUUID } from "node:crypto";
import type { KeyDuration, KeyOrigin } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { generateKey, hashKey, keyLast4, maskKey, normalizeKey } from "@/lib/keys";
import { accessStatus } from "@/lib/access-math";
import { DURATIONS } from "@/lib/durations";

export const MAX_KEYS_PER_BATCH = 500;

export type CreateKeysInput = {
  productId: string;
  duration: KeyDuration;
  quantity: number;
  origin: KeyOrigin;
  createdBy: string;
  note?: string | null;
};

/**
 * Gera keys e grava só o hash. Retorna as keys em texto UMA ÚNICA VEZ:
 * depois disso ninguém consegue recuperá-las.
 */
export async function createKeys(input: CreateKeysInput) {
  const quantity = Math.trunc(input.quantity);
  if (quantity < 1 || quantity > MAX_KEYS_PER_BATCH) throw new Error("Quantidade inválida");

  for (let attempt = 0; attempt < 3; attempt++) {
    const plain = new Set<string>();
    while (plain.size < quantity) plain.add(generateKey());
    const keys = [...plain];
    const batchId = randomUUID();
    try {
      await db.$transaction([
        db.key.createMany({
          data: keys.map((k) => ({
            keyHash: hashKey(k),
            last4: keyLast4(k),
            productId: input.productId,
            duration: input.duration,
            origin: input.origin,
            createdBy: input.createdBy,
            note: input.note || null,
            batchId,
          })),
        }),
        db.auditLog.create({
          data: {
            actor: input.createdBy,
            action: "KEY_GENERATE",
            target: batchId,
            meta: { productId: input.productId, duration: input.duration, quantity, origin: input.origin },
          },
        }),
      ]);
      return { batchId, keys };
    } catch (e) {
      // Colisão de hash (praticamente impossível): tenta de novo com keys novas.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("Não foi possível gerar keys únicas");
}

/** Busca uma key pelo texto digitado (compara pelo hash). */
export async function findKeyByText(raw: string) {
  const canonical = normalizeKey(raw);
  if (!canonical) return null;
  return db.key.findUnique({
    where: { keyHash: hashKey(canonical) },
    include: {
      product: { select: { id: true, slug: true, name: true } },
      redemption: {
        include: { user: { select: { id: true, discordId: true, username: true, globalName: true } } },
      },
    },
  });
}

/** Status de uma key no formato usado pela API do bot. */
export async function describeKey(raw: string) {
  const key = await findKeyByText(raw);
  if (!key) return null;
  let access: { status: string; expiresAt: Date | null } | null = null;
  if (key.redemption) {
    const a = await db.access.findUnique({
      where: { userId_productId: { userId: key.redemption.userId, productId: key.productId } },
    });
    if (a) access = { status: accessStatus(a), expiresAt: a.lifetime ? null : a.expiresAt };
  }
  return {
    id: key.id,
    masked: maskKey(key.last4),
    status: key.status,
    duration: DURATIONS[key.duration].api,
    durationLabel: DURATIONS[key.duration].label,
    product: key.product,
    createdAt: key.createdAt,
    createdBy: key.createdBy,
    note: key.note,
    revokedAt: key.revokedAt,
    revokeReason: key.revokeReason,
    redemption: key.redemption
      ? {
          redeemedAt: key.redemption.redeemedAt,
          user: {
            discordId: key.redemption.user.discordId,
            name: key.redemption.user.globalName ?? key.redemption.user.username,
          },
          access,
        }
      : null,
  };
}
