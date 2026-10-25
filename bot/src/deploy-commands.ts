// Registra os slash commands no seu servidor. Rode de novo sempre que mudar algum comando.
import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { loadConfigOrExit } from "./config.js";

const config = loadConfigOrExit();
const rest = new REST().setToken(config.DISCORD_TOKEN);
const body = commands.map((c) => c.data.toJSON());

const result = (await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID), {
  body,
})) as unknown[];
console.log(`✔ ${result.length} comandos registrados no servidor ${config.DISCORD_GUILD_ID}: ${body.map((c) => "/" + c.name).join(", ")}`);
