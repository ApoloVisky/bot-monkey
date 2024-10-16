const { Client, GatewayIntentBits } = require("discord.js");
const DisTube = require("distube").DisTube;
const { YouTubePlugin } = require("@distube/youtube");
const playdl = require("play-dl");
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

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
    encoder: "opus",
    args: ["-b:a", "96k"],
  },
});

const commands = new Map();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
}

client.once("ready", () => {
  console.log(`Bot está online como ${client.user.tag}`);
});

distube.on("playSong", (queue, song) => {
  queue.textChannel.send(`Tocando agora: **${song.name}**`);
});

distube.on("finishSong", (queue) => {
  if (queue.songs.length === 0) {
    queue.textChannel.send("A fila está vazia. Desconectando.");
    distube.stop(queue.guild.id);
  }
});

distube.on("error", (queue, error) => {
  console.error("Erro na fila:", error);
  queue.textChannel.send("Ocorreu um erro na fila de músicas.");
  sendErrorLog(`Erro na fila: ${error.message}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const commandName = message.content.split(" ")[0].substring(1);
  const command = commands.get(commandName);

  if (command) {
    await command.execute(message, distube); 
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
