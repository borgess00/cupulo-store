import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { redeemHelpMessage } from "../embeds.js";
import type { Command } from "./types.js";

export const resgatar: Command = {
  staffOnly: false,
  data: new SlashCommandBuilder().setName("resgatar").setDescription("Como resgatar sua key no site."),

  async execute(interaction, { config }) {
    await interaction.reply({ ...redeemHelpMessage(config.SITE_URL), flags: MessageFlags.Ephemeral });
  },
};
