const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const ytsr = require('ytsr');
const fs = require('fs');
const youtube = require('youtube-sr');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Estruturas de dados para a fila
const queue = new Map(); // Armazenar filas por guildId

// Função para buscar e tocar música
const playSong = async (interaction, query) => {
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({ content: 'Você precisa estar em um canal de voz para reproduzir música!', ephemeral: true });
  }

  const permissions = voiceChannel.permissionsFor(interaction.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return interaction.reply({ content: 'Eu preciso de permissão para entrar e falar no seu canal de voz!', ephemeral: true });
  }

  let url = query;
  
  // Se a URL for uma playlist do YouTube
  if (query.includes('playlist')) {
    try {
      const playlistVideos = await getPlaylistVideos(query);
      if (playlistVideos.length === 0) {
        return interaction.editReply({ content: "Nenhum vídeo encontrado na playlist.", ephemeral: true });
      }

      // Adiciona todos os vídeos da playlist à fila
      const guildId = interaction.guild.id;
      if (!queue.has(guildId)) {
        queue.set(guildId, { songs: [], voiceChannel: voiceChannel, connection: null });
      }

      for (const video of playlistVideos) {
        queue.get(guildId).songs.push(video);
      }

      // Inicia a reprodução se não estiver tocando
      if (!queue.get(guildId).isPlaying) {
        playNext(guildId, interaction);
      }

      return await interaction.editReply({ content: `🎶 A playlist foi adicionada à fila!`, ephemeral: true });
    } catch (error) {
      return interaction.editReply({ content: "Erro ao buscar vídeos da playlist.", ephemeral: true });
    }
  }

  // Se não for uma playlist, trate como uma música normal
  if (!ytdl.validateURL(query)) {
    try {
      const searchResults = await ytsr(query, { limit: 1 });
      if (searchResults.items.length > 0 && searchResults.items[0].url) {
        url = searchResults.items[0].url;
      } else {
        return interaction.editReply({ content: "Nenhum vídeo encontrado para a busca.", ephemeral: true });
      }
    } catch (error) {
      return interaction.editReply({ content: "Erro ao buscar vídeo no YouTube.", ephemeral: true });
    }
  }


  const guildId = interaction.guild.id;
  const song = { url: url, title: query };
  if (!queue.has(guildId)) {
    queue.set(guildId, { songs: [], voiceChannel: voiceChannel, connection: null });
  }
  queue.get(guildId).songs.push(song);


  if (!queue.get(guildId).isPlaying) {
    playNext(guildId, interaction);
  }

  await interaction.editReply({ content: `🎶 **${song.title}** foi adicionada à fila!`, ephemeral: true });
};


const getPlaylistVideos = async (playlistUrl) => {
  const playlistId = playlistUrl.split('list=')[1];
  const playlist = await youtube.getPlaylist(playlistId);
  const videos = await playlist.fetch();
  return videos.map(video => ({ url: video.url, title: video.title })); 
};


const playNext = async (guildId, interaction) => {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || serverQueue.songs.length === 0) {
    serverQueue.isPlaying = false;
    return; 
  }

  const song = serverQueue.songs.shift(); 
  const connection = joinVoiceChannel({
    channelId: serverQueue.voiceChannel.id,
    guildId: guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });

  const stream = ytdl(song.url, { filter: 'audioonly' });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  player.play(resource);
  connection.subscribe(player);
  serverQueue.connection = connection; 

  player.on(AudioPlayerStatus.Playing, () => {
    console.log(`Tocando: ${song.title}`);
    interaction.channel.send(`🎶 Tocando agora: **${song.title}**`);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log('A música terminou.');
    if (serverQueue.songs.length > 0) {
      playNext(guildId, interaction); 
    } else {
  
      queue.delete(guildId); 
    }
  });

  player.on('error', error => {
    console.error(`Erro no player: ${error.message}`);
    interaction.channel.send('Houve um erro ao tentar tocar a música.');

    playNext(guildId, interaction); 
  });
};

// Carregar comandos
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

      
      if (interaction.commandName === 'play') {
        const query = interaction.options.getString('url'); 
        await playSong(interaction, query);
      } else {
        await command.execute(interaction);
      }

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

client.login(process.env.DISCORD_TOKEN);
