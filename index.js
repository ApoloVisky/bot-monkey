const { Client, GatewayIntentBits } = require("discord.js");
const DisTube = require("distube").DisTube;
const { YouTubePlugin } = require("@distube/youtube");
const playdl = require("play-dl");
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { stringify } = require("flatted");

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
    args: [
      "-b:a",
      "128k",
      "-fflags",
      "+nobuffer",
      "-flags",
      "+low_delay",
      "-use_wallclock_as_timestamps",
      "1",
      "-strict",
      "-2",
      "-buffer_size",
      "10M",
      "-preset",
      "ultrafast",
    ],
  },
});

distube.on("error", (queue, error) => {
  console.error("Erro na fila:", error);
  queue.textChannel.send("Ocorreu um erro na fila de músicas.");
  sendErrorLog(`Erro na fila: ${error.message}`);
});

distube.setMaxListeners(20);

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
  try {
    const songList = queue.songs.map((song) => ({
      name: song.name,
      formattedDuration: song.formattedDuration,
    }));

    console.log(`Fila atual: ${stringify(songList)}`);
  } catch (error) {
    console.error("Erro ao serializar a fila:", error);
    sendErrorLog(`Erro ao serializar a fila: ${error.message}`);
  }
});

distube.on("playSong", (song) => {
  console.log(`Iniciando reprodução da música: ${song.name}`);
});

const removeErrorListeners = () => {
  distube.removeAllListeners("error");
  console.log("Todos os ouvintes de erro foram removidos.");
};

client.on("messageCreate", async (message) => {
  const startTime = Date.now();

  if (message.author.bot || !message.guild) return;

  const args = message.content.split(" ").slice(1);
  const commandName = message.content.split(" ")[0].substring(1);
  const command = commands.get(commandName);

  if (command) {
    await command.execute(message, distube);

    if (commandName === "clearListeners") {
      removeErrorListeners();
    }

    const duration = Date.now() - startTime;
    console.log(`Comando ${commandName} executado em ${duration}ms`);
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

setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  console.log(`Uso de memória: ${memoryUsage.rss / 1024 / 1024} MB`);
  console.log(
    `Uso de CPU: ${cpuUsage.user / 1000} ms (user), ${
      cpuUsage.system / 1000
    } ms (system)`
  );
}, 10000);

client.login(process.env.DISCORD_TOKEN);
