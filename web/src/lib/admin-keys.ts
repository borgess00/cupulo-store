import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { hashKey, normalizeKey } from "@/lib/keys";

export type KeyFilters = { q?: string; status?: string; product?: string; batch?: string };

/** Traduz a busca do admin em filtro do Prisma. A key completa é buscada pelo hash. */
export function buildKeyWhere(f: KeyFilters): Prisma.KeyWhereInput {
  const and: Prisma.KeyWhereInput[] = [];
  if (f.status === "AVAILABLE" || f.status === "REDEEMED" || f.status === "REVOKED") and.push({ status: f.status });
  if (f.product) and.push({ productId: f.product });
  if (f.batch) and.push({ batchId: f.batch });

  const q = f.q?.trim();
  if (q) {
    const full = normalizeKey(q);
    if (full) and.push({ keyHash: hashKey(full) });
    else if (/^[A-Za-z2-9]{4}$/.test(q) && !/^\d+$/.test(q)) and.push({ last4: q.toUpperCase() });
    else if (/^\d{5,25}$/.test(q)) {
      and.push({ OR: [{ createdBy: q }, { redemption: { user: { discordId: q } } }] });
    } else {
      and.push({
        OR: [
          { note: { contains: q, mode: "insensitive" } },
          { redemption: { user: { username: { contains: q, mode: "insensitive" } } } },
          { redemption: { user: { globalName: { contains: q, mode: "insensitive" } } } },
        ],
      });
    }
  }
  return and.length ? { AND: and } : {};
}
