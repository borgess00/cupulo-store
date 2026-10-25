import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { errorEmbed, keyStatusEmbed, logoFile } from "../embeds.js";
import type { Command } from "./types.js";

export const consultarkey: Command = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("consultarkey")
    .setDescription("Mostra o status de uma key.")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) => o.setName("key").setDescription("CUPULO-XXXX-XXXX-XXXX").setRequired(true).setMaxLength(64)),

  async execute(interaction, { api }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const info = await api.getKey(interaction.options.getString("key", true));
    if (!info) {
      await interaction.editReply({ embeds: [errorEmbed("Key não encontrada. Confira se digitou certinho.")] });
      return;
    }
    await interaction.editReply({ embeds: [keyStatusEmbed(info)], files: [logoFile()], allowedMentions: { parse: [] } });
  },
};
