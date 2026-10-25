import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Armazenamento dos arquivos.
 * - Produção: Supabase Storage. Bucket de packs PRIVADO (só links assinados) e
 *   bucket de imagens PÚBLICO (capas dos produtos).
 * - Desenvolvimento sem Supabase: pasta local `.storage/` servida por /api/dev-storage
 *   com o mesmo esquema de links assinados e temporários.
 */

export type Bucket = "packs" | "imagens";

const DOWNLOAD_TTL_SEC = 5 * 60;

function bucketName(b: Bucket) {
  return b === "packs"
    ? process.env.SUPABASE_BUCKET_PACKS || "packs"
    : process.env.SUPABASE_BUCKET_IMAGES || "imagens";
}

export function storageMode(): "supabase" | "local" {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  if (process.env.NODE_ENV === "production") {
    throw new Error("Supabase Storage não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return "local";
}

let client: SupabaseClient | undefined;
function supabase() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage;
}

// ── Driver local (apenas dev) ────────────────────────────────────────────
type LocalOp = "get" | "put";

export function signLocal(op: LocalOp, bucket: Bucket, key: string, ttlSec: number, filename?: string) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = Buffer.from(JSON.stringify({ op, bucket, key, exp, filename })).toString("base64url");
  const sig = createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(payload).digest("base64url");
  return `/api/dev-storage?t=${payload}.${sig}`;
}

export function verifyLocal(token: string):
  | { op: LocalOp; bucket: Bucket; key: string; exp: number; filename?: string }
  | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.exp < Date.now() / 1000) return null;
  return data;
}

// ── API usada pelo app ───────────────────────────────────────────────────

/** Link de download assinado, válido por poucos minutos. */
export async function createDownloadUrl(key: string, filename: string, ttlSec = DOWNLOAD_TTL_SEC): Promise<string> {
  if (storageMode() === "local") return signLocal("get", "packs", key, ttlSec, filename);
  const { data, error } = await supabase()
    .from(bucketName("packs"))
    .createSignedUrl(key, ttlSec, { download: filename });
  if (error || !data) throw new Error(`Falha ao assinar download: ${error?.message}`);
  return data.signedUrl;
}

/** URL para o navegador do admin enviar o arquivo direto ao bucket (PUT). */
export async function createUploadUrl(bucket: Bucket, key: string): Promise<string> {
  if (storageMode() === "local") return signLocal("put", bucket, key, 2 * 60 * 60);
  const { data, error } = await supabase().from(bucketName(bucket)).createSignedUploadUrl(key);
  if (error || !data) throw new Error(`Falha ao assinar upload: ${error?.message}`);
  return data.signedUrl;
}

/** Tamanho real do objeto no bucket (null se não existe). */
export async function objectSize(bucket: Bucket, key: string): Promise<number | null> {
  if (storageMode() === "local") {
    const { localObjectSize } = await import("@/lib/storage-local");
    return localObjectSize(bucket, key);
  }
  const { data, error } = await supabase().from(bucketName(bucket)).info(key);
  if (error || !data) return null;
  return Number(data.size ?? 0);
}

export async function deleteObject(bucket: Bucket, key: string): Promise<void> {
  if (storageMode() === "local") {
    const { localDelete } = await import("@/lib/storage-local");
    return localDelete(bucket, key);
  }
  const { error } = await supabase().from(bucketName(bucket)).remove([key]);
  if (error) throw new Error(`Falha ao apagar arquivo: ${error.message}`);
}

/** URL pública de uma imagem (bucket de imagens). */
export function publicImageUrl(key: string): string {
  if (storageMode() === "local") return `/api/dev-storage/public/${encodeURIComponent(key)}`;
  return supabase().from(bucketName("imagens")).getPublicUrl(key).data.publicUrl;
}
