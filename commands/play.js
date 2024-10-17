const CommandModel = require("../models/CommandModel");
const { SlashCommandBuilder } = require('discord.js')

class CommandPlay extends CommandModel {
  constructor() {
    super()

    this.data = new SlashCommandBuilder()

    this.data.setName("play");
    this.data.setDescription('Toca uma música')

    this.data.addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Busca a playlist ou música no YouTube")
        .setRequired(true)
    );
  }

  async execute(interaction, distube) {
    const url = interaction.options.getString("url");

    if (!url) {
      return interaction.editReply({
        content: "Por favor, forneça uma URL ou nome da música.",
        ephemeral: true,
      });
    }

    const queue = distube.getQueue(interaction.guildId);
    if (!queue) {
      await distube.play(interaction.member.voice.channel, url, {
        textChannel: interaction.channel,
        member: interaction.member,
      });
      return interaction.editReply(`🎶 Começando a tocar **${url}**!`);
    } else {
      await distube.play(interaction.member.voice.channel, url);
      return interaction.editReply(`🎶 Adicionado **${url}** à fila!`);
    }
  }
}

module.exports = new CommandPlay();
