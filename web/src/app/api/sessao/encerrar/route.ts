import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";

/**
 * Encerra a sessão de quem tem cookie válido mas não pode usar o site
 * (conta bloqueada ou apagada). Sem isso, /login e /biblioteca ficariam
 * se redirecionando para sempre. Para usuários normais, não faz nada.
 */
export async function GET(req: Request) {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return NextResponse.redirect(new URL("/login", req.url));

  const user = await db.user.findUnique({ where: { id }, select: { banned: true } });
  if (user && !user.banned) return NextResponse.redirect(new URL("/biblioteca", req.url));

  await signOut({ redirectTo: `/login?erro=${user?.banned ? "banido" : "sessao"}` });
}
