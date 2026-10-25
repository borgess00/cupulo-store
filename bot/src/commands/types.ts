import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SharedSlashCommand,
} from "discord.js";
import type { SiteApi } from "../api.js";
import type { Config } from "../config.js";

export type BotContext = { config: Config; api: SiteApi };

export type Command = {
  data: SharedSlashCommand;
  /** Só quem tem um dos cargos de staff pode usar. */
  staffOnly: boolean;
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction, ctx: BotContext): Promise<void>;
};
