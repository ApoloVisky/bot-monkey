module.exports = {
    name: 'stop',
    description: 'Para a música e limpa a fila.',
    async execute(interaction, distube) {
      try {
        const queue = distube.getQueue(interaction.guild.id);
        
        if (!queue) {
          return interaction.reply('Não há nenhuma música tocando no momento.');
        }
  
        distube.stop(interaction.guild.id);
  
        await interaction.reply('Música parada e fila limpa!');
      } catch (error) {
        console.error(error);
        await interaction.reply('Ocorreu um erro ao tentar parar a música.');
      }
    },
  };
  