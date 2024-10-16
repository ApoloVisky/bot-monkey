const playdl = require("play-dl");

module.exports = {
  name: 'play',
  description: 'Toca uma música pelo nome ou URL.',
  async execute(message, distube) { 
    const args = message.content.split(" ").slice(1);
    if (!args.length) return message.reply("Por favor, forneça o nome ou URL da música.");

  
    const searchResults = await playdl.search(args.join(" "), { limit: 1 }); 
    if (searchResults.length === 0) return message.reply("Nenhuma música encontrada com esse nome.");

    const url = searchResults[0].url;

    try {
     
      await distube.play(message.member.voice.channel, url, {
        textChannel: message.channel,
        member: message.member,
      });
      message.reply(`Adicionada à fila: **${searchResults[0].title}**`);
    } catch (error) {
      console.error(error);
      message.reply("Ocorreu um erro ao tentar tocar a música.");
    }
  },
};
