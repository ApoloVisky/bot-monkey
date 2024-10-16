module.exports = {
    name: 'skip',
    description: 'Pula a música atual.',
    async execute(message, distube) {
      const queue = distube.getQueue(message.guild.id);
      if (!queue) return message.reply("Não há músicas na fila.");
      await distube.skip(message.guild.id);
      message.reply("Música pulada.");
    },
  };
  