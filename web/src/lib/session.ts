import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminDiscordId } from "@/lib/env";

/**
 * Sessão do Auth.js. O `connection()` marca o ponto como "hora da requisição"
 * antes do auth() (que usa crypto), como o Cache Components exige.
 */
export async function getSession() {
  await connection();
  return auth();
}

/**
 * Usuário logado, conferido no banco (existe e não está banido).
 * Lê cookies: só chame dentro de <Suspense> ou em rotas/ações.
 */
export async function getCurrentUser() {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.banned) return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(callbackPath = "/biblioteca"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!isAdminDiscordId(user.discordId)) redirect("/");
  return user;
}
