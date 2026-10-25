"use server";

import { refresh } from "next/cache";
import { audit } from "@/lib/audit";
import { grantManualAccess, removeAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { isAdminDiscordId } from "@/lib/env";
import { requireAdmin } from "@/lib/session";
import { z } from "@/lib/zod";

export type UserActionState = { ok: boolean; error?: string; message?: string } | null;

const GrantInput = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1, "Escolha um produto"),
  mode: z.enum(["7", "30", "custom", "lifetime"]),
  days: z.coerce.number().int().min(1).max(3650).optional(),
});

export async function grantAccessAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const admin = await requireAdmin();
  const parsed = GrantInput.safeParse({
    userId: formData.get("userId"),
    productId: formData.get("productId"),
    mode: formData.get("mode"),
    days: formData.get("days") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { userId, productId, mode, days } = parsed.data;
  if (mode === "custom" && !days) return { ok: false, error: "Informe quantos dias." };

  const [user, product] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.product.findUnique({ where: { id: productId }, select: { id: true, name: true } }),
  ]);
  if (!user || !product) return { ok: false, error: "Usuário ou produto não encontrado." };

  const grant = mode === "lifetime" ? ({ lifetime: true } as const) : { days: mode === "custom" ? days! : Number(mode) };
  await grantManualAccess(user.id, product.id, grant, admin.discordId);
  refresh();
  return { ok: true, message: `Acesso a ${product.name} concedido.` };
}

export async function removeAccessAction(userId: string, productId: string): Promise<UserActionState> {
  const admin = await requireAdmin();
  await removeAccess(userId, productId, admin.discordId);
  refresh();
  return { ok: true };
}

export async function setBanAction(userId: string, banned: boolean): Promise<UserActionState> {
  const admin = await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Usuário não encontrado." };
  if (banned && (user.id === admin.id || isAdminDiscordId(user.discordId))) {
    return { ok: false, error: "Não é possível bloquear um administrador." };
  }
  await db.user.update({ where: { id: userId }, data: { banned } });
  await audit(admin.discordId, banned ? "USER_BAN" : "USER_UNBAN", userId);
  refresh();
  return { ok: true };
}
