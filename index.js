const { Client, GatewayIntentBits } = require("discord.js");
const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const fs = require("fs");
require("dotenv").config();
const fetch = require("node-fetch");
const { CookieJar } = require("tough-cookie");
const { fromJSON } = require("tough-cookie");
const { HttpsProxyAgent } = require("https-proxy-agent");
const ytdl = require("@distube/ytdl-core");

// Carregar cookies do arquivo JSON
const cookiesJSON = fs.readFileSync('./cookies.json', 'utf-8');
const cookieJar = CookieJar.fromJSON(cookiesJSON);

console.log("Cookies carregados:", cookieJar);

// Configurar o proxy
const proxy = {
  host: 'ec2-54-233-2-72.sa-east-1.compute.amazonaws.com',
  port: 8888,
  protocol: 'http',
};

const agent = new HttpsProxyAgent({
  host: proxy.host,
  port: proxy.port,
  protocol: proxy.protocol,
  rejectUnauthorized: false, 
});

const fetchWithCookies = async (url, options) => {
  try {
    const response = await fetch(url, { ...options, agent });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      const text = await response.text();
      throw new Error(`Resposta não é JSON: ${text}`);
    }
  } catch (error) {
    console.error(`Erro ao fazer a requisição para ${url}:`, error);
    throw error;
  }
};

fetchWithCookies("https://exemplo.com", { method: "GET" })
  .then(data => console.log(data))
  .catch(error => console.error("Erro na requisição:", error));

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
  emitAddListWhenCreatingQueue: true,
  emitAddSongWhenCreatingQueue: true,
  ffmpeg: {
    args: [
      "-reconnect", "1",
      "-reconnect_streamed", "1",
      "-reconnect_delay_max", "5",
      "-vn",
      "-b:a", "192k",
      "-ar", "48000",
      "-ac", "2",
      "-f", "s16le",
      "-af", "aresample=async=1:min_hard_comp=0.100000:first_pts=0,volume=1.5",
      "-bufsize", "64k"
    ],
  },
});


const originalGetInfo = ytdl.getInfo;
ytdl.getInfo = async (url, options) => {
  options = options || {};
  options.requestOptions = options.requestOptions || {};
  options.requestOptions.client = agent;
  options.requestOptions.headers = {
    Cookie: await new Promise((resolve, reject) => {
      cookieJar.getCookies(url, {}, (err, cookies) => {
        if (err) {
          reject(err);
        } else {
          resolve(cookies.map(cookie => `${cookie.key}=${cookie.value}`).join('; '));
        }
      });
    }),
  };
  return originalGetInfo(url, options);
};


const loadCommands = () => {
  const commands = new Map();
  const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

  commandFiles.forEach(file => {
    const command = require(`./commands/${file}`);
    if (command && command.data && typeof command.execute === "function") {
      commands.set(command.data.name, command);
    } else {
      console.warn(`O comando ${file} está faltando "name" ou "execute".`);
    }
  });

  return commands;
};

const commands = loadCommands();

client.once("ready", () => {
  console.log(`Bot está online como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);

  if (command) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply({ ephemeral: true });
      }

      await command.execute(interaction, distube);

      if (!interaction.replied) {
        await interaction.editReply("Comando executado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao executar o comando:", error);

      if (!interaction.replied) {
        await interaction.editReply("Houve um erro ao executar esse comando.");
      }
    }
  } else {
    if (!interaction.replied) {
      await interaction.reply({
        content: "Comando não encontrado.",
        ephemeral: true,
      });
    }
  }
});

distube.on("playSong", (queue, song) => {
  if (!queue || !song) {
    console.log("Erro: Não foi possível obter a fila ou a música.");
    return;
  }

  console.log(`Tocando agora: ${song.name}`);
  queue.textChannel?.send(`🎶 Tocando agora: **${song.name}**`);
});

distube.on("finishSong", (queue, song) => {
  if (!queue || !song) {
    console.log("Erro ao finalizar: Fila ou música indefinida.");
    return;
  }

  console.log(`Música terminada: ${song.name}`);
});

distube.on("error", (error) => {
  console.error("Erro no DisTube:", error.message);
});

client.login(process.env.DISCORD_TOKEN);