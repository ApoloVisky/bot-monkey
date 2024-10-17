const CommandModel = require("../models/CommandModel");
const { SlashCommandBuilder } = require('discord.js');

class CommandPlay extends CommandModel {
  constructor() {
    super();

    this.data = new SlashCommandBuilder()
      .setName("play")
      .setDescription('Toca uma música')
      .addStringOption((option) =>
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

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply({
        content: "Você precisa estar em um canal de voz para tocar música!",
        ephemeral: true,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return interaction.editReply({
        content: "Eu preciso de permissões para entrar e falar no seu canal de voz!",
        ephemeral: true,
      });
    }

    const queue = distube.getQueue(interaction.guildId);
    try {
      if (!queue) {
        await distube.play(voiceChannel, url, {
          textChannel: interaction.channel,
          member: interaction.member,
        });
        return interaction.editReply(`🎶 Começando a tocar **${url}**!`);
      } else {
        await distube.play(voiceChannel, url);
        return interaction.editReply(`🎶 Adicionado **${url}** à fila!`);
      }
    } catch (error) {
      console.error('Erro ao executar o comando:', error);
      return interaction.editReply({
        content: 'Houve um erro ao tentar tocar a música.',
        ephemeral: true,
      });
    }
  }
}

module.exports = new CommandPlay();