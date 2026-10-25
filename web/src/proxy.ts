import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Primeira barreira (redireciona cedo). As páginas, ações e rotas
// conferem sessão e acesso de novo no servidor, perto dos dados.
const MEMBER_PATHS = ["/resgatar", "/biblioteca", "/produto", "/gerador-sensi", "/perfil", "/admin"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;
  const loggedIn = !!user?.id;

  if (pathname === "/login") {
    if (loggedIn) return NextResponse.redirect(new URL("/biblioteca", req.nextUrl));
    return NextResponse.next();
  }

  const needsLogin = MEMBER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsLogin && !loggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && !user?.isAdmin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/resgatar/:path*",
    "/biblioteca/:path*",
    "/produto/:path*",
    "/gerador-sensi/:path*",
    "/perfil/:path*",
    "/admin/:path*",
  ],
};
