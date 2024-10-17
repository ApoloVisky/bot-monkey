module.exports = {
  name: "play",
  description: "Toca uma música",
  async execute(message, distube) {
    const args = message.content.split(" ").slice(1);
    const songName = args.join(" ");
    if (!songName) return message.reply("Por favor, forneça o nome da música!");

    try {
      
      const queue = await distube.play(
        message.member.voice.channel,
        songName,
        {
          textChannel: message.channel,
          member: message.member,
        }
      );

    
      if (!queue || !queue.songs || queue.songs.length === 0) {
        return message.reply("Ocorreu um problema ao adicionar a música à fila.");
      }

      
      message.channel.send(`Tocando agora: **${queue.songs[0].name}**`);
    } catch (error) {
      console.error("Erro ao tentar tocar a música:", error);
      message.channel.send("Ocorreu um erro ao tentar tocar a música.");
    }
  },
};