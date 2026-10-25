import "server-only";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Bucket } from "@/lib/storage";

// Storage em disco, usado só em desenvolvimento sem Supabase.
const ROOT = path.join(process.cwd(), ".storage");

function safePath(bucket: Bucket, key: string) {
  const base = path.join(ROOT, bucket);
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new Error("Caminho inválido");
  return full;
}

export async function localWrite(bucket: Bucket, key: string, data: Buffer) {
  const p = safePath(bucket, key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}

export async function localRead(bucket: Bucket, key: string) {
  return readFile(safePath(bucket, key));
}

export async function localObjectSize(bucket: Bucket, key: string) {
  try {
    return (await stat(safePath(bucket, key))).size;
  } catch {
    return null;
  }
}

export async function localDelete(bucket: Bucket, key: string) {
  await rm(safePath(bucket, key), { force: true });
}
