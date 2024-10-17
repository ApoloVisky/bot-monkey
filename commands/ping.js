
const CommandModel = require('../models/CommandModel')


class PingCommand extends CommandModel {
  constructor() {
    super()


    this.data.setName('ping')

    this.data.setDescription('Retorna Pong!')
  }

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.followUp({ content: 'Pong!', ephemeral: true });
  }
}


module.exports = new PingCommand();
