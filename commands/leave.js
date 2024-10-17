
const CommandModel = require('../models/CommandModel')

class LeaveCommand extends CommandModel {


  constructor() {
    super()

    this.data.setName('leave')
    this.data.setDescription('Desconecta o bot do canal de voz.')
  }

  async execute(interaction, distube) {
    await interaction.deferReply({ ephemeral: true });

    const queue = distube.getQueue(interaction.guild.id);

    if (!queue) {
      return interaction.followUp({
        content: "Não estou em um canal de voz.",
        ephemeral: true,
      });
    }

    distube.voices.get(interaction.guild.id).leave();
    return interaction.followUp({
      content: "Desconectado do canal de voz.",
      ephemeral: true,
    });
  }
}


module.exports = new LeaveCommand();
