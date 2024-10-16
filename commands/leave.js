module.exports = {
    name: 'leave',
    description: 'Desconecta o bot do canal de voz.',
    async execute(message, distube) {
      const queue = distube.getQueue(message.guild.id);
      if (!queue) return message.reply("Não estou em um canal de voz.");
      distube.voices.get(message.guild.id).leave();
      message.reply("Desconectado do canal de voz.");
    },
  };
  