const CommandModel = require('../models/CommandModel');

class SkipCommand extends CommandModel {
  constructor() {
    super();

    this.data.setName("skip");
    this.data.setDescription("Pula a música atual.");
  }

  async execute(interaction, distube) {
    try {
      const queue = distube.getQueue(interaction.guild.id);

      if (!queue) {
        if (!interaction.replied) {
          return interaction.editReply("Não há músicas na fila para pular.");
        } else {
          return;
        }
      }

      await distube.skip(interaction.guild.id);

      const nextSong = queue.songs[0];

      if (!interaction.replied) {
        return interaction.editReply(`Música pulada! Agora tocando: **${nextSong.name}**`);
      }
    } catch (error) {
      console.error("Erro ao executar o comando:", error);

      if (!interaction.replied) {
        await interaction.editReply({
          content: 'Houve um erro ao tentar pular a música.',
          ephemeral: true,
        });
      }
    }
  }
}

module.exports = new SkipCommand();