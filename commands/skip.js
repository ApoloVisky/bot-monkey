module.exports = {
  name: "skip",
  description: "Pula a música atual.",
  async execute(interaction, distube) {
    try {
      const queue = distube.getQueue(interaction.guild.id);

      
      if (!queue) {
        
        return interaction.reply({
          content: "Não há músicas na fila para pular.",
          ephemeral: true,
        });
      }

     
      await distube.skip(interaction.guild.id);

      const nextSong = queue.songs[0]; 

     
      await interaction.reply(`🎶 Música pulada! Agora tocando: **${nextSong.name}**`);
    } catch (error) {
      console.error("Erro ao executar o comando:", error);

      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Houve um erro ao executar esse comando.",
          ephemeral: true,
        });
      }
    }
  },
};
