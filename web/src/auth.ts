import NextAuth from "next-auth";
import type { DiscordProfile } from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { devLoginEnabled } from "@/lib/env";

const devLogin = Credentials({
  id: "dev-login",
  name: "Login de teste",
  credentials: { discordId: {}, name: {} },
  async authorize(raw) {
    if (!devLoginEnabled()) return null;
    const parsed = z
      .object({ discordId: z.string().regex(/^\d{5,25}$/), name: z.string().min(1).max(32) })
      .safeParse(raw);
    if (!parsed.success) return null;
    const { discordId, name } = parsed.data;
    const user = await db.user.upsert({
      where: { discordId },
      create: { discordId, username: name, globalName: name },
      update: { lastLoginAt: new Date() },
    });
    if (user.banned) return null;
    return { id: user.id, name: user.globalName ?? user.username, discordId };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, ...(devLoginEnabled() ? [devLogin] : [])],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "discord") return true;
      const p = profile as DiscordProfile | undefined;
      if (!p?.id) return false;
      const existing = await db.user.findUnique({ where: { discordId: p.id }, select: { banned: true } });
      if (existing?.banned) return "/login?erro=banido";
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "discord" && profile) {
        const p = profile as DiscordProfile;
        const dbUser = await db.user.upsert({
          where: { discordId: p.id },
          create: { discordId: p.id, username: p.username, globalName: p.global_name, avatar: p.avatar },
          update: { username: p.username, globalName: p.global_name, avatar: p.avatar, lastLoginAt: new Date() },
        });
        token.uid = dbUser.id;
        token.discordId = p.id;
        token.name = p.global_name ?? p.username;
        token.avatar = p.avatar;
      } else if (account?.provider === "dev-login" && user) {
        token.uid = user.id;
        token.discordId = (user as { discordId?: string }).discordId;
        token.name = user.name;
        token.avatar = null;
      }
      return token;
    },
  },
});
