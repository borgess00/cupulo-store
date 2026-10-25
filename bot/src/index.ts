import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { SiteApi } from "./api.js";
import { loadConfigOrExit } from "./config.js";
import { handleInteraction } from "./handler.js";

const config = loadConfigOrExit();
const api = new SiteApi(config.SITE_URL, config.BOT_API_TOKEN);

// Só precisamos do intent Guilds: comandos, DMs e cargos usam a API REST.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`✔ Bot online como ${c.user.tag}`);
  c.user.setActivity("Resgate sua key: /resgatar", { type: ActivityType.Custom });
  try {
    const products = await api.listProducts();
    console.log(`✔ API do site respondeu (${products.length} produtos)`);
  } catch (e) {
    console.error("✖ Não consegui falar com a API do site:", e instanceof Error ? e.message : e);
  }
});

client.on(Events.InteractionCreate, (interaction) => {
  handleInteraction(interaction, { config, api }).catch((e) => console.error("[interaction]", e));
});

client.on(Events.Error, (e) => console.error("[discord]", e));
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log("Desligando…");
    await client.destroy();
    process.exit(0);
  });
}

await client.login(config.DISCORD_TOKEN);
