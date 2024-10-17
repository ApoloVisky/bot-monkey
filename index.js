const { Client, GatewayIntentBits } = require("discord.js");
const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
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
    args: ["-b:a", "128kbps", "-buffer_size", "80M"],
  },
});


const loadCommands = () => {
  const commands = new Map();
  const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

  commandFiles.forEach(file => {
    const command = require(`./commands/${file}`);
    if (command.name && typeof command.execute === "function") {
      commands.set(command.name, command);
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
  
      if (!interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      
      
      await command.execute(interaction, distube);

     
      if (!interaction.replied) {
        await interaction.editReply("Comando executado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao executar o comando:", error);
      await interaction.editReply("Houve um erro ao executar esse comando.");
    }
  } else {
    await interaction.reply({
      content: "Comando não encontrado.",
      ephemeral: true,
    });
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


distube.on("error", (channel, error) => {
  console.error("Erro no DisTube:", error);
  if (channel) channel.send("Ocorreu um erro ao tentar reproduzir a música.");
});

client.login(process.env.DISCORD_TOKEN);
