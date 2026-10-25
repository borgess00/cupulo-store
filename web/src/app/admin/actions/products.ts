"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { PRODUCTS_TAG } from "@/lib/products";
import { requireAdmin } from "@/lib/session";
import { safeFileName } from "@/lib/slug";
import { createUploadUrl, deleteObject, objectSize, publicImageUrl } from "@/lib/storage";
import { youtubeId } from "@/lib/youtube";
import { z } from "@/lib/zod";

export type ActionState = { ok: boolean; error?: string; message?: string } | null;

const ProductInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífens").max(60),
  shortDesc: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(10000),
  category: z.string().trim().min(2).max(40),
  platform: z.enum(["ANDROID", "IOS", "EMULADOR", "MOBILADOR", "MULTI"]),
  type: z.enum(["PACK", "TOOL"]),
  youtubeUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || youtubeId(v) !== null, "Link do YouTube inválido"),
  tutorialMd: z.string().max(50000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  active: z.boolean(),
});

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = ProductInput.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDesc: formData.get("shortDesc"),
    description: formData.get("description"),
    category: formData.get("category"),
    platform: formData.get("platform"),
    type: formData.get("type"),
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    tutorialMd: formData.get("tutorialMd") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first?.path.join(".")}: ${first?.message}` };
  }
  const { id, ...data } = parsed.data;
  const values = { ...data, youtubeUrl: data.youtubeUrl || null, tutorialMd: data.tutorialMd || null };

  let savedId = id;
  try {
    if (id) {
      await db.product.update({ where: { id }, data: values });
      await audit(admin.discordId, "PRODUCT_UPDATE", id, { slug: data.slug });
    } else {
      const created = await db.product.create({ data: values });
      savedId = created.id;
      await audit(admin.discordId, "PRODUCT_CREATE", created.id, { slug: data.slug });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Já existe um produto com esse slug." };
    }
    throw e;
  }
  updateTag(PRODUCTS_TAG);
  refresh();
  if (!id) redirect(`/admin/produtos/${savedId}?criado=1`);
  return { ok: true, message: "Produto salvo." };
}

export async function deleteProduct(productId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { files: true, _count: { select: { keys: true, accesses: true, redemptions: true } } },
  });
  if (!product) return { ok: false, error: "Produto não encontrado." };
  if (product._count.keys || product._count.accesses || product._count.redemptions) {
    return { ok: false, error: "Este produto já tem keys ou clientes. Desative-o em vez de excluir." };
  }
  for (const f of product.files) await deleteObject("packs", f.storageKey).catch(() => undefined);
  await db.product.delete({ where: { id: productId } });
  await audit(admin.discordId, "PRODUCT_DELETE", productId, { slug: product.slug });
  updateTag(PRODUCTS_TAG);
  redirect("/admin/produtos");
}

// ── Uploads (o navegador envia direto para o bucket) ─────────────────────

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_IMAGE = 5 * 1024 * 1024;

export async function prepareUpload(input: {
  productId: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: "file" | "image";
}): Promise<{ ok: true; url: string; storageKey: string } | { ok: false; error: string }> {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id: input.productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Produto não encontrado." };
  if (!Number.isFinite(input.size) || input.size <= 0) return { ok: false, error: "Arquivo vazio." };

  if (input.kind === "image") {
    const ext = IMAGE_TYPES[input.contentType];
    if (!ext) return { ok: false, error: "Use uma imagem PNG, JPG ou WEBP." };
    if (input.size > MAX_IMAGE) return { ok: false, error: "Imagem muito grande (máx. 5 MB)." };
    const storageKey = `produtos/${product.id}/${randomUUID()}.${ext}`;
    return { ok: true, url: await createUploadUrl("imagens", storageKey), storageKey };
  }

  const storageKey = `${product.id}/${randomUUID()}-${safeFileName(input.fileName)}`;
  return { ok: true, url: await createUploadUrl("packs", storageKey), storageKey };
}

export async function confirmFileUpload(input: {
  productId: string;
  storageKey: string;
  name: string;
  version?: string;
  mimeType: string;
}): Promise<ActionState> {
  const admin = await requireAdmin();
  // Só aceita objetos dentro da pasta do próprio produto.
  if (!input.storageKey.startsWith(`${input.productId}/`)) return { ok: false, error: "Arquivo inválido." };
  const size = await objectSize("packs", input.storageKey);
  if (size === null) return { ok: false, error: "O arquivo não chegou ao storage. Tente de novo." };
  const name = input.name.trim().slice(0, 120) || "arquivo";
  const file = await db.productFile.create({
    data: {
      productId: input.productId,
      name,
      storageKey: input.storageKey,
      sizeBytes: BigInt(size),
      mimeType: input.mimeType.slice(0, 120) || "application/octet-stream",
      version: input.version?.trim().slice(0, 20) || null,
    },
  });
  await audit(admin.discordId, "FILE_UPLOAD", file.id, { productId: input.productId, name, size });
  refresh();
  return { ok: true, message: "Arquivo enviado." };
}

export async function confirmImageUpload(input: { productId: string; storageKey: string }): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!input.storageKey.startsWith(`produtos/${input.productId}/`)) return { ok: false, error: "Imagem inválida." };
  const size = await objectSize("imagens", input.storageKey);
  if (size === null) return { ok: false, error: "A imagem não chegou ao storage." };
  await db.product.update({ where: { id: input.productId }, data: { imageUrl: publicImageUrl(input.storageKey) } });
  await audit(admin.discordId, "PRODUCT_UPDATE", input.productId, { image: input.storageKey });
  updateTag(PRODUCTS_TAG);
  refresh();
  return { ok: true };
}

export async function removeProductImage(productId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  await db.product.update({ where: { id: productId }, data: { imageUrl: null } });
  await audit(admin.discordId, "PRODUCT_UPDATE", productId, { image: null });
  updateTag(PRODUCTS_TAG);
  refresh();
  return { ok: true };
}

export async function deleteProductFile(fileId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  const file = await db.productFile.findUnique({ where: { id: fileId } });
  if (!file) return { ok: false, error: "Arquivo não encontrado." };
  await deleteObject("packs", file.storageKey).catch((e) => console.error("[storage] remover", e));
  await db.productFile.delete({ where: { id: fileId } });
  await audit(admin.discordId, "FILE_DELETE", fileId, { name: file.name, productId: file.productId });
  refresh();
  return { ok: true };
}

// ── Changelog ────────────────────────────────────────────────────────────

const ChangelogInput = z.object({
  productId: z.string().min(1),
  version: z.string().trim().min(1).max(20),
  notes: z.string().trim().min(1).max(5000),
});

export async function addChangelog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = ChangelogInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  await db.changelogEntry.create({ data: parsed.data });
  await audit(admin.discordId, "PRODUCT_UPDATE", parsed.data.productId, { changelog: parsed.data.version });
  refresh();
  return { ok: true, message: "Versão adicionada." };
}

export async function deleteChangelog(id: string): Promise<ActionState> {
  await requireAdmin();
  await db.changelogEntry.delete({ where: { id } }).catch(() => undefined);
  refresh();
  return { ok: true };
}
