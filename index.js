const { Client, GatewayIntentBits } = require("discord.js");
const DisTube = require("distube").DisTube;
const { YouTubePlugin } = require("@distube/youtube");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

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
    args: ["-b:a", "60kbps", "-buffer_size", "80M"],
  },
});

const commands = loadCommands("./commands");

client.once("ready", () => {
  console.log(`Bot está online como ${client.user.tag}`);
});

let lastErrorTime = 0;
const errorCooldown = 5000;

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const [commandName, ...args] = message.content.split(" ");
  const command = commands.get(commandName.substring(1));

  if (commandName === "!play") {
    await handlePlayCommand(message, args.join(" "));
  } else if (commandName === "!stop") {
    await handleStopCommand(message);
  } else if (command) {
    await command.execute(message, distube);
  }
});

function loadCommands(directory) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".js"))
    .reduce((acc, file) => {
      const command = require(`${directory}/${file}`);
      acc.set(command.name, command);
      return acc;
    }, new Map());
}

async function handlePlayCommand(message, songName) {
  if (!message.member.voice.channel) {
    return message.reply(
      "Você precisa estar em um canal de voz para tocar músicas!"
    );
  }

  if (!songName) return message.reply("Por favor, forneça o nome da música!");

  try {
    const queue = await distube.play(message.member.voice.channel, songName, {
      textChannel: message.channel,
      member: message.member,
    });

    if (queue) {
      message.channel.send(`Tocando agora: **${queue.songs[0].name}**`);
      console.log(`Tocando agora: ${queue.songs[0].name}`);
    }
  } catch (error) {
    handleError(message, error);
  }
}

async function handleStopCommand(message) {
  const queue = distube.getQueue(message);
  if (!queue) return message.reply("Não há músicas tocando.");

  distube.stop(message);
  message.channel.send("A música foi parada e o bot desconectou.");
  console.log("A música foi parada e o bot desconectou.");
}

function handleError(message, error) {
  const currentTime = Date.now();
  if (currentTime - lastErrorTime >= errorCooldown) {
    console.error("Erro ao tentar tocar a música:", error);
    message.channel.send(`Ocorreu um erro: ${error.message}`);
    sendErrorLog(error.message);
    lastErrorTime = currentTime;
  }
}

distube.on("error", (queue, error) => {
  console.error("Erro na fila:", error);
  if (isCriticalError(error)) {
    queue?.textChannel?.send("Erro crítico na fila de músicas.");
    sendErrorLog(error.message);
  }
});

distube.on("playSong", (queue, song) => {
  queue?.textChannel?.send(`Tocando agora: **${song.name}**`);
  console.log(`Tocando agora: ${song.name}`);
});

distube.on("finishSong", (queue) => {
  console.log(`Música terminada: ${queue.songs[0]?.name || "desconhecida"}`);
  if (queue.songs.length > 0) {
    queue.textChannel.send(`A música **${queue.songs[0].name}** terminou!`);
  }
});

distube.on("finishQueue", async (queue) => {
  if (queue?.textChannel) {
    queue.textChannel.send(
      "A fila de músicas acabou. O bot está saindo do canal de voz."
    );
    await queue.voice.channel.leave();
    console.log("Desconectado do canal de voz.");
  }
});

function isCriticalError(error) {
  const criticalErrors = [
    "VOICE_CONNECT_FAILED",
    "NO_RESULT",
    "PLAYBACK_ERROR",
  ];
  return criticalErrors.includes(error.errorCode);
}

async function sendErrorLog(error) {
  try {
    await axios.post(process.env.WEBHOOK_URL, { content: error });
  } catch (err) {
    console.error("Erro ao enviar log para o webhook:", err);
  }
}

client.login(process.env.DISCORD_TOKEN);
