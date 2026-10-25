import { NextResponse } from "next/server";
import { storageMode } from "@/lib/storage";
import { localRead } from "@/lib/storage-local";

// Imagens públicas no modo local (dev). Em produção o Supabase serve direto.
export async function GET(_req: Request, ctx: RouteContext<"/api/dev-storage/public/[key]">) {
  let local = false;
  try {
    local = process.env.NODE_ENV !== "production" && storageMode() === "local";
  } catch {}
  if (!local) return new NextResponse(null, { status: 404 });
  const { key } = await ctx.params;
  try {
    const data = await localRead("imagens", decodeURIComponent(key));
    const ext = key.split(".").pop()?.toLowerCase();
    const type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[ext ?? ""];
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": type ?? "application/octet-stream" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
