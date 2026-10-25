import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isAdminDiscordId } from "@/lib/env";
import { accessStatus, extendExpiry, isAccessActive, shrinkExpiry } from "@/lib/access-math";

type Tx = Prisma.TransactionClient;

type LockedAccess = { id: string; expiresAt: Date | null; lifetime: boolean; manualLifetime: boolean };

/**
 * Garante que a linha de acesso existe e a trava até o fim da transação.
 * Assim, dois resgates ao mesmo tempo para o mesmo produto somam certo.
 */
export async function lockAccess(tx: Tx, userId: string, productId: string): Promise<LockedAccess> {
  await tx.$executeRaw`
    INSERT INTO "Access" ("id", "userId", "productId", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${productId}, now(), now())
    ON CONFLICT ("userId", "productId") DO NOTHING`;
  const rows = await tx.$queryRaw<LockedAccess[]>`
    SELECT "id", "expiresAt", "lifetime", "manualLifetime" FROM "Access"
    WHERE "userId" = ${userId} AND "productId" = ${productId}
    FOR UPDATE`;
  return rows[0]!;
}

/** Aplica o tempo de uma key resgatada (dias ou vitalícia). */
export async function applyKeyGrant(tx: Tx, userId: string, productId: string, days: number | null, now = new Date()) {
  const access = await lockAccess(tx, userId, productId);
  return tx.access.update({
    where: { id: access.id },
    data:
      days === null
        ? { lifetime: true }
        : { expiresAt: extendExpiry(access.expiresAt, days, now) },
  });
}

export type RevokeResult =
  | { ok: true; wasRedeemed: boolean }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_REVOKED" };

/**
 * Revoga uma key. Se já tinha sido resgatada, remove do acesso o tempo que ela deu:
 * - temporária: tira os dias;
 * - vitalícia: o acesso só continua vitalício se houver outra key vitalícia ativa
 *   ou vitalício manual do admin. O tempo das keys temporárias é preservado.
 */
export async function revokeKey(keyId: string, actor: string, reason?: string): Promise<RevokeResult> {
  return db.$transaction(async (tx) => {
    // Trava a key para não colidir com um resgate acontecendo agora.
    const locked = await tx.$queryRaw<{ id: string; status: string }[]>`
      SELECT "id", "status" FROM "Key" WHERE "id" = ${keyId} FOR UPDATE`;
    if (!locked[0]) return { ok: false, code: "NOT_FOUND" } as const;
    if (locked[0].status === "REVOKED") return { ok: false, code: "ALREADY_REVOKED" } as const;

    const key = await tx.key.update({
      where: { id: keyId },
      data: { status: "REVOKED", revokedAt: new Date(), revokedBy: actor, revokeReason: reason || null },
      include: { redemption: true },
    });

    const r = key.redemption;
    if (r) {
      const access = await lockAccess(tx, r.userId, r.productId);
      if (r.daysGranted !== null) {
        await tx.access.update({
          where: { id: access.id },
          data: { expiresAt: shrinkExpiry(access.expiresAt, r.daysGranted) },
        });
      } else if (access.lifetime) {
        const otherLifetime = await tx.redemption.count({
          where: {
            userId: r.userId,
            productId: r.productId,
            daysGranted: null,
            keyId: { not: keyId },
            key: { status: "REDEEMED" },
          },
        });
        await tx.access.update({
          where: { id: access.id },
          data: { lifetime: access.manualLifetime || otherLifetime > 0 },
        });
      }
    }

    await tx.auditLog.create({
      data: { actor, action: "KEY_REVOKE", target: keyId, meta: { reason: reason ?? null, redeemed: !!r } },
    });
    return { ok: true, wasRedeemed: !!r } as const;
  });
}

/** Acesso manual pelo admin: soma dias ou dá vitalício. */
export async function grantManualAccess(
  userId: string,
  productId: string,
  grant: { days: number } | { lifetime: true },
  actor: string,
) {
  return db.$transaction(async (tx) => {
    const access = await lockAccess(tx, userId, productId);
    const updated = await tx.access.update({
      where: { id: access.id },
      data: "lifetime" in grant
        ? { lifetime: true, manualLifetime: true }
        : { expiresAt: extendExpiry(access.expiresAt, grant.days) },
    });
    await tx.auditLog.create({
      data: { actor, action: "ACCESS_GRANT", target: `${userId}:${productId}`, meta: grant },
    });
    return updated;
  });
}

/** Remove totalmente o acesso (tempo e vitalício). Novas keys voltam a liberar. */
export async function removeAccess(userId: string, productId: string, actor: string) {
  return db.$transaction(async (tx) => {
    const access = await lockAccess(tx, userId, productId);
    await tx.access.update({
      where: { id: access.id },
      data: { expiresAt: null, lifetime: false, manualLifetime: false },
    });
    await tx.auditLog.create({ data: { actor, action: "ACCESS_REMOVE", target: `${userId}:${productId}` } });
  });
}

/** O usuário tem acesso ativo a este produto agora? (checagem do servidor) */
export async function hasActiveAccess(userId: string, productId: string): Promise<boolean> {
  const access = await db.access.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { expiresAt: true, lifetime: true },
  });
  return !!access && isAccessActive(access);
}

/** Pode abrir o produto? Admins sempre podem (pré-visualização). */
export async function canAccessProduct(user: { id: string; discordId: string }, productId: string): Promise<boolean> {
  if (isAdminDiscordId(user.discordId)) return true;
  return hasActiveAccess(user.id, productId);
}

/** Todos os acessos do usuário (ativos e expirados), com o produto. */
export async function listUserAccesses(userId: string) {
  const now = new Date();
  const rows = await db.access.findMany({
    where: { userId, OR: [{ lifetime: true }, { expiresAt: { not: null } }] },
    include: {
      product: {
        select: { id: true, slug: true, name: true, shortDesc: true, imageUrl: true, category: true, platform: true, type: true },
      },
    },
  });
  return rows
    .map((a) => ({ ...a, status: accessStatus(a, now) }))
    .sort((a, b) => {
      const rank = { lifetime: 0, active: 1, expired: 2 } as const;
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0);
    });
}
