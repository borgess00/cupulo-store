import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { accessesEmbed, logoFile } from "../embeds.js";
import type { Command } from "./types.js";

export const acessos: Command = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("acessos")
    .setDescription("Mostra os produtos ativos de um cliente.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName("usuario").setDescription("Cliente").setRequired(true)),

  async execute(interaction, { api }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("usuario", true);
    const data = await api.getUserAccesses(target.id);
    await interaction.editReply({
      embeds: [accessesEmbed({ id: target.id, username: target.username }, data)],
      files: [logoFile()],
      allowedMentions: { parse: [] },
    });
  },
};
