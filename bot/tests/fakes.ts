// Interações falsas do Discord para testar os comandos sem conectar no Discord.
import type { BotContext } from "../src/commands/types.js";
import { SiteApi } from "../src/api.js";
import type { Config } from "../src/config.js";

export const config: Config = {
  DISCORD_TOKEN: "x".repeat(30),
  DISCORD_CLIENT_ID: "111111111111111111",
  DISCORD_GUILD_ID: "222222222222222222",
  STAFF_ROLE_IDS: ["333333333333333333"],
  CLIENT_ROLE_ID: "444444444444444444",
  DELIVERY_LOG_CHANNEL_ID: "555555555555555555",
  SITE_URL: "https://cupulo.test",
  BOT_API_TOKEN: "t".repeat(40),
};

type Options = Record<string, string | number | { id: string; username: string; bot?: boolean; send?: (p: unknown) => Promise<unknown> }>;

export function fakeUser(id: string, username: string, opts: { bot?: boolean; dmClosed?: boolean } = {}) {
  const sent: unknown[] = [];
  return {
    id,
    username,
    bot: !!opts.bot,
    sent,
    toString: () => `<@${id}>`,
    async send(payload: unknown) {
      if (opts.dmClosed) throw Object.assign(new Error("Cannot send messages to this user"), { code: 50007 });
      sent.push(payload);
      return {};
    },
  };
}

export function fakeInteraction(commandName: string, options: Options, opts: { staff?: boolean; guildId?: string } = {}) {
  const rolesAdded: string[] = [];
  const logMessages: unknown[] = [];
  const state = { replies: [] as unknown[], edits: [] as unknown[], deferred: false, replied: false };
  const interaction = {
    commandName,
    guildId: opts.guildId ?? config.DISCORD_GUILD_ID,
    user: { id: "999999999999999999", username: "staffer", toString: () => "<@999999999999999999>" },
    member: { roles: opts.staff === false ? [] : [config.STAFF_ROLE_IDS[0]!] },
    get deferred() { return state.deferred; },
    get replied() { return state.replied; },
    isAutocomplete: () => false,
    isChatInputCommand: () => true,
    options: {
      getString: (n: string) => (options[n] as string | undefined) ?? null,
      getInteger: (n: string) => (options[n] as number | undefined) ?? null,
      getUser: (n: string) => options[n] ?? null,
    },
    async deferReply() { state.deferred = true; },
    async reply(p: unknown) { state.replied = true; state.replies.push(p); },
    async editReply(p: unknown) { state.edits.push(p); },
    guild: {
      members: {
        async fetch() {
          return { roles: { cache: new Map(), async add(id: string) { rolesAdded.push(id); } } };
        },
      },
    },
    client: {
      channels: {
        async fetch() {
          return { isSendable: () => true, async send(p: unknown) { logMessages.push(p); } };
        },
      },
    },
  };
  return { interaction, state, rolesAdded, logMessages };
}

/** API com fetch falso que responde como o site. */
export function mockApi(handler: (path: string, init?: RequestInit) => { status: number; body: unknown }) {
  const calls: { path: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const path = url.replace(`${config.SITE_URL}/api/bot`, "");
    calls.push({ path, init });
    const r = handler(path, init);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const ctx: BotContext = { config, api: new SiteApi(config.SITE_URL, config.BOT_API_TOKEN, fetchImpl) };
  return { ctx, calls };
}

/** Pega o JSON dos embeds de um payload de resposta. */
export function embedsJson(payload: unknown): Record<string, unknown>[] {
  const p = payload as { embeds?: { toJSON(): Record<string, unknown> }[] };
  return (p.embeds ?? []).map((e) => e.toJSON());
}
