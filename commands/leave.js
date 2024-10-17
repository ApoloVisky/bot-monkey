module.exports = {
  name: 'leave',
  description: 'Desconecta o bot do canal de voz.',
  options: [],
  async execute(interaction, distube) {
    // Deferir a resposta para evitar timeout
    await interaction.deferReply({ ephemeral: true });

    const queue = distube.getQueue(interaction.guild.id);

    if (!queue) {
      return interaction.followUp({
        content: "Não estou em um canal de voz.",
        ephemeral: true,
      });
    }

    // Deixa o canal de voz
    distube.voices.get(interaction.guild.id).leave();
    return interaction.followUp({
      content: "Desconectado do canal de voz.",
      ephemeral: true,
    });
  },
};
