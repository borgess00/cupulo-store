import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessProduct } from "@/lib/access";
import { db } from "@/lib/db";
import { clientIp, hashIp } from "@/lib/ip";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { createDownloadUrl } from "@/lib/storage";

// POST /api/download/:fileId — devolve um link assinado de 5 minutos,
// só para quem está logado e tem acesso ATIVO ao produto do arquivo.
export async function POST(req: Request, ctx: RouteContext<"/api/download/[fileId]">) {
  if (!isSameOrigin(req)) return NextResponse.json({ message: "Requisição bloqueada." }, { status: 403 });

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ message: "Faça login para baixar." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, discordId: true, banned: true } });
  if (!user || user.banned) return NextResponse.json({ message: "Conta sem permissão." }, { status: 403 });

  const { fileId } = await ctx.params;
  const file = await db.productFile.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 });

  if (!(await canAccessProduct(user, file.productId))) {
    return NextResponse.json({ message: "Seu acesso a este produto não está ativo." }, { status: 403 });
  }

  const limit = await rateLimit(`download:${user.id}`, 20, 60);
  if (!limit.ok) {
    return NextResponse.json({ message: `Muitos downloads seguidos. Aguarde ${limit.retryAfterSec}s.` }, { status: 429 });
  }

  const url = await createDownloadUrl(file.storageKey, file.name);
  await db.downloadLog.create({
    data: {
      userId: user.id,
      productId: file.productId,
      fileId: file.id,
      ipHash: hashIp(clientIp(req.headers)),
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  return NextResponse.json({ url });
}
