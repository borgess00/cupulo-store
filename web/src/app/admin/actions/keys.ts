"use server";

import { refresh } from "next/cache";
import { revokeKey } from "@/lib/access";
import { db } from "@/lib/db";
import { DURATIONS } from "@/lib/durations";
import { createKeys, MAX_KEYS_PER_BATCH } from "@/lib/key-service";
import { requireAdmin } from "@/lib/session";
import { z } from "@/lib/zod";

export type GenerateState =
  | null
  | { ok: false; error: string }
  | { ok: true; keys: string[]; product: string; duration: string; batchId: string; createdAt: string };

const GenerateInput = z.object({
  productId: z.string().min(1, "Escolha um produto"),
  duration: z.enum(["DAYS_7", "DAYS_30", "LIFETIME"]),
  quantity: z.coerce.number().int().min(1).max(MAX_KEYS_PER_BATCH),
  note: z.string().trim().max(200).optional(),
});

export async function generateKeysAction(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const admin = await requireAdmin();
  const parsed = GenerateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, name: true } });
  if (!product) return { ok: false, error: "Produto não encontrado." };

  const { keys, batchId } = await createKeys({
    productId: product.id,
    duration: parsed.data.duration,
    quantity: parsed.data.quantity,
    origin: "ADMIN",
    createdBy: admin.discordId,
    note: parsed.data.note,
  });
  return {
    ok: true,
    keys,
    product: product.name,
    duration: DURATIONS[parsed.data.duration].label,
    batchId,
    createdAt: new Date().toISOString(),
  };
}

export async function revokeKeyAction(keyId: string, reason: string) {
  const admin = await requireAdmin();
  const r = await revokeKey(keyId, admin.discordId, reason.trim().slice(0, 200) || undefined);
  if (!r.ok) return { ok: false as const, error: r.code === "ALREADY_REVOKED" ? "A key já estava revogada." : "Key não encontrada." };
  refresh();
  return { ok: true as const, wasRedeemed: r.wasRedeemed };
}
