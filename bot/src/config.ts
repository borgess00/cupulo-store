import "dotenv/config";
import { z } from "zod";

z.config(z.locales.ptBR());

const snowflake = z.string().regex(/^\d{5,25}$/, "deve ser um ID do Discord");
const idList = z
  .string()
  .default("")
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(snowflake));

const schema = z.object({
  DISCORD_TOKEN: z.string().min(20, "token do bot ausente"),
  DISCORD_CLIENT_ID: snowflake,
  DISCORD_GUILD_ID: snowflake,
  STAFF_ROLE_IDS: idList.refine((l) => l.length > 0, "informe pelo menos um cargo de staff"),
  CLIENT_ROLE_ID: snowflake.optional().or(z.literal("").transform(() => undefined)),
  DELIVERY_LOG_CHANNEL_ID: snowflake.optional().or(z.literal("").transform(() => undefined)),
  SITE_URL: z.string().url().transform((u) => u.replace(/\/$/, "")),
  BOT_API_TOKEN: z.string().min(32, "BOT_API_TOKEN precisa ter pelo menos 32 caracteres"),
});

export type Config = z.infer<typeof schema>;

/** Carrega o .env; se estiver errado, mostra o problema e encerra (sem stack trace). */
export function loadConfigOrExit(): Config {
  try {
    return loadConfig();
  } catch (e) {
    console.error(`✖ ${e instanceof Error ? e.message : e}\n\nConfira o arquivo .env (modelo em .env.example).`);
    process.exit(1);
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuração inválida no .env do bot:\n${lines}`);
  }
  return parsed.data;
}
