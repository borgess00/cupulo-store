import "server-only";
import { z } from "@/lib/zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_DISCORD_ID: z.string().min(1),
  AUTH_DISCORD_SECRET: z.string().min(1),
  ADMIN_DISCORD_IDS: z.string().default(""),
  KEY_PEPPER: z.string().min(32, "KEY_PEPPER precisa ter pelo menos 32 caracteres"),
  BOT_API_TOKEN: z.string().min(32, "BOT_API_TOKEN precisa ter pelo menos 32 caracteres"),
  DISCORD_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_PACKS: z.string().default("packs"),
  SUPABASE_BUCKET_IMAGES: z.string().default("imagens"),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/** Variáveis do servidor, validadas na primeira leitura (não no build). */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const campos = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${campos}`);
  }
  cached = parsed.data;
  return cached;
}

export function adminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_DISCORD_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isAdminDiscordId(discordId: string | null | undefined): boolean {
  return !!discordId && adminIds().has(discordId);
}

/** Login de teste sem Discord: só existe em `next dev`. */
export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.AUTH_DEV_LOGIN === "true";
}
