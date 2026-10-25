import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export const PRODUCTS_TAG = "products";

/** Vitrine pública (em cache; o admin invalida ao editar produtos). */
export async function getStoreProducts() {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");
  return db.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      shortDesc: true,
      imageUrl: true,
      category: true,
      platform: true,
      type: true,
    },
  });
}

export type StoreProduct = Awaited<ReturnType<typeof getStoreProducts>>[number];

/** Produto completo para a página do produto (sem cache: depende de acesso). */
export async function getProductPage(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      files: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, sizeBytes: true, version: true, createdAt: true } },
      changelog: { orderBy: { publishedAt: "desc" } },
    },
  });
}
