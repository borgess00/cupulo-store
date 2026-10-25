import { NextResponse } from "next/server";
import { storageMode, verifyLocal } from "@/lib/storage";
import { localRead, localWrite } from "@/lib/storage-local";

// Simula o Supabase Storage em desenvolvimento. Em produção responde 404.
function enabled() {
  try {
    return process.env.NODE_ENV !== "production" && storageMode() === "local";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!enabled()) return new NextResponse(null, { status: 404 });
  const t = verifyLocal(new URL(req.url).searchParams.get("t") ?? "");
  if (!t || t.op !== "get") return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 });
  try {
    const data = await localRead(t.bucket, t.key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(t.filename ?? "arquivo")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}

export async function PUT(req: Request) {
  if (!enabled()) return new NextResponse(null, { status: 404 });
  const t = verifyLocal(new URL(req.url).searchParams.get("t") ?? "");
  if (!t || t.op !== "put") return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 403 });
  await localWrite(t.bucket, t.key, Buffer.from(await req.arrayBuffer()));
  return NextResponse.json({ Key: t.key });
}
