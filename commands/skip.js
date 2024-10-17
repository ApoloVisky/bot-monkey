module.exports = {
  name: "skip",
  description: "Pula a música atual.",
  async execute(message, distube) {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply("Não há músicas tocando.");

    try {
      if (queue.songs.length <= 1) {
        return message.reply("Não há músicas para pular.");
      }

      const skippedSong = await distube.skip(message);
      message.channel.send(`Música pulada: **${skippedSong.name}**`);
    } catch (error) {
      console.error("Erro ao tentar pular a música:", error);
      message.channel.send(
        `Ocorreu um erro ao tentar pular a música: ${error.message}`
      );
    }
  },
};
