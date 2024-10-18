const CommandModel = require('../models/CommandModel');

class SkipCommand extends CommandModel {
  constructor() {
    super();

    this.data.setName("skip");
    this.data.setDescription("Pula a música atual.");
  }

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const serverQueue = interaction.client.queue.get(guildId); // Acesse a fila de músicas

    if (!serverQueue) {
      return interaction.reply({
        content: "Não há músicas na fila para pular.",
        ephemeral: true,
      });
    }

    // Remove a música atual
    const skippedSong = serverQueue.songs.shift(); // Remove a música atual
    console.log(`Música pulada: ${skippedSong.title}`);

    // Se ainda houver músicas na fila, toca a próxima
    if (serverQueue.songs.length > 0) {
      const nextSong = serverQueue.songs[0];
      serverQueue.player.stop(); // Para a música atual, isso aciona o evento Idle
      interaction.reply(`Música pulada! Agora tocando: **${nextSong.title}**`);
    } else {
      interaction.reply("Música pulada! Não há mais músicas na fila.");
      serverQueue.isPlaying = false; // Atualiza o estado da fila
      if (serverQueue.connection && serverQueue.connection.state.status !== 'destroyed') {
        serverQueue.connection.destroy(); // Desconecta se não houver mais músicas
      }
    }
  }
}

module.exports = new SkipCommand();
