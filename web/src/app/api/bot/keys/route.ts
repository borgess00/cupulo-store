import { NextResponse } from "next/server";
import { z } from "@/lib/zod";
import { badRequest, isBotAuthorized, unauthorized } from "@/lib/bot-auth";
import { db } from "@/lib/db";
import { DURATIONS, parseDuration } from "@/lib/durations";
import { createKeys } from "@/lib/key-service";

const Body = z.object({
  product: z.string().min(1).max(100), // slug ou id
  duration: z.string().min(1).max(20),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  createdBy: z.string().regex(/^\d{5,25}$/, "createdBy deve ser o ID do Discord de quem gerou"),
  note: z.string().max(200).optional(),
});

// POST /api/bot/keys — gera keys. Resposta traz as keys em texto (única vez).
export async function POST(req: Request) {
  if (!isBotAuthorized(req)) return unauthorized();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Dados inválidos", z.flattenError(parsed.error).fieldErrors);
  const { product: productRef, quantity, createdBy, note } = parsed.data;

  const duration = parseDuration(parsed.data.duration);
  if (!duration) return badRequest("Duração inválida. Use 7d, 30d ou lifetime.");

  const product = await db.product.findFirst({
    where: { OR: [{ slug: productRef }, { id: productRef }] },
    select: { id: true, slug: true, name: true },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const { batchId, keys } = await createKeys({
    productId: product.id,
    duration,
    quantity,
    origin: "BOT",
    createdBy,
    note,
  });

  return NextResponse.json(
    {
      product,
      duration: DURATIONS[duration].api,
      durationLabel: DURATIONS[duration].label,
      batchId,
      keys,
    },
    { status: 201 },
  );
}
