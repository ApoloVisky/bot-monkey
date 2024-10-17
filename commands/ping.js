module.exports = {
    name: 'ping',
    description: 'Retorna Pong!',
    options: [], 
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.followUp({ content: 'Pong!', ephemeral: true });
    },
  };
  