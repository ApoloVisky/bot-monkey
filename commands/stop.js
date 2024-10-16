module.exports = {
    name: 'stop',
    description: 'Para a música atual e limpa a fila.',
    async execute(message, distube) {
      const queue = distube.getQueue(message.guild.id);
      if (!queue) return message.reply("Não há músicas na fila.");
      await distube.stop(message.guild.id);
      message.reply("Música parada e fila limpa.");
    },
  };
  