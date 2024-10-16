const { Client, GatewayIntentBits } = require("discord.js");
const DisTube = require("distube").DisTube;
const { YouTubePlugin } = require("@distube/youtube");
require("dotenv").config();
const playdl = require("play-dl");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [new YouTubePlugin()],
  ffmpeg: {
    encoder: 'opus',
    args: ['-b:a', '128k'],
  },
});

client.once("ready", () => {
  console.log(`Bot está online como ${client.user.tag}`);
});



distube.on("addSong", (queue, song) => {
  queue.textChannel.send(`Música adicionada à fila: **${song.name}**`);
});

distube.on("finishSong", (queue) => {
  if (queue.songs.length === 0) {
    queue.textChannel.send("A fila está vazia. Desconectando.");
    distube.stop(queue.guild.id);
  } else {
    queue.textChannel.send("A música terminou!");
  }
});

distube.on("error", (queue, error) => {
  console.error("Erro na fila:", error);
  queue.textChannel.send("Ocorreu um erro na fila de músicas.");
  sendErrorLog(`Erro na fila: ${error.message}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  if (message.content.startsWith("!play")) {
    const args = message.content.split(" ").slice(1);
    let url = args[0];

    if (!message.member.voice.channel) {
      return message.reply("Você precisa estar em um canal de voz para tocar músicas!");
    }

    try {
      if (!url || !url.startsWith("http")) {
        const searchResults = await playdl.search(args.join(" "), { limit: 1 });
        if (searchResults.length > 0) {
          url = searchResults[0].url;
          message.reply(`Tocando a música: "${searchResults[0].title}"`);
        } else {
          return message.reply("Nenhuma música encontrada com esse nome.");
        }
      }

      const voiceChannel = message.member.voice.channel;
      await distube.play(voiceChannel, url, {
        member: message.member,
        textChannel: message.channel,
        message,
      });
    } catch (error) {
      console.error(`Erro ao tocar a música: ${error.message}`);
      await sendErrorLog(`Erro ao tocar a música: ${error.message}`);
      message.reply(`Erro ao tocar a música: ${error.message}`);
    }
  }

  if (message.content.startsWith("!leave")) {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) return message.reply("Não estou tocando nenhuma música.");

    distube.stop(message.guild.id);
    message.reply("Desconectei do canal de voz!");
  }

  if (message.content.startsWith("!stop")) {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) return message.reply("Não estou tocando nenhuma música.");

    distube.stop(message.guild.id);
    message.reply("Música parada e a fila foi limpa!");
  }
});

// Função para enviar logs de erro para o webhook
async function sendErrorLog(error) {
  try {
    await axios.post(process.env.WEBHOOK_URL, { content: error });
  } catch (err) {
    console.error("Erro ao enviar log para o webhook:", err);
  }
}

client.login(process.env.DISCORD_TOKEN);
