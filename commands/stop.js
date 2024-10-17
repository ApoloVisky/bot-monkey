const CommandModel = require('../models/CommandModel')

class StopCommand extends CommandModel {

  constructor() {
    super()

    this.data.setName('stop')
    this.data.setDescription('Para a música e limpa a fila.')
  }

  async execute(interaction, distube) {
    try {
      const queue = distube.getQueue(interaction.guild.id);

      if (!queue) {
        return interaction.editReply('Não há nenhuma música tocando no momento.');
      }

      distube.stop(interaction.guild.id);

      await interaction.editReply('Música parada e fila limpa!');
    } catch (error) {
      console.error(error);
      await interaction.editReply('Ocorreu um erro ao tentar parar a música.');
    }
  }
}


module.exports = new StopCommand();
