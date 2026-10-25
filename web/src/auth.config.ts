import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import { discordAvatarUrl } from "@/lib/discord";

/**
 * Configuração compartilhada com o proxy (sem acesso ao banco).
 * O auth.ts completo acrescenta o upsert do usuário no login.
 */
export const authConfig = {
  providers: [
    Discord({
      // Só precisamos do perfil público: sem e-mail.
      authorization: { params: { scope: "identify" } },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      const discordId = token.discordId ?? "";
      session.user = {
        ...session.user,
        id: token.uid ?? "",
        discordId,
        name: token.name ?? "Jogador",
        image: discordId ? discordAvatarUrl(discordId, token.avatar) : null,
        isAdmin: (process.env.ADMIN_DISCORD_IDS ?? "")
          .split(",")
          .map((s) => s.trim())
          .includes(discordId),
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
