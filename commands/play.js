const CommandModel = require("../models/CommandModel");
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const ytsr = require('ytsr');

class CommandPlay extends CommandModel {
  constructor() {
    super();
    this.data = new SlashCommandBuilder()
      .setName("play")
      .setDescription('Toca uma música do YouTube')
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("URL ou nome da música do YouTube")
          .setRequired(true)
      );

    this.queue = new Map(); // Armazena a fila de reprodução por guildId
  }

  async execute(interaction) {
    let query = interaction.options.getString("query");

    if (!query) {
      return interaction.reply({
        content: "Por favor, forneça uma URL ou nome da música.",
        ephemeral: true,
      });
    }

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "Você precisa estar em um canal de voz para tocar música!",
        ephemeral: true,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return interaction.reply({
        content: "Eu preciso de permissões para entrar e falar no seu canal de voz!",
        ephemeral: true,
      });
    }

    // Se a query não for uma URL, busca a música no YouTube
    if (!ytdl.validateURL(query)) {
      const searchResults = await ytsr(query, { limit: 1 });
      if (searchResults.items.length === 0) {
        return interaction.reply({
          content: "Nenhuma música foi encontrada com esse nome.",
          ephemeral: true,
        });
      }
      query = searchResults.items[0].url; // Pega a URL da primeira música encontrada
    }

    // Adiciona a música à fila
    const guildId = interaction.guild.id;
    const song = { url: query, title: query }; // Você pode adicionar mais informações sobre a música se desejar
    if (!this.queue.has(guildId)) {
      this.queue.set(guildId, { songs: [], isPlaying: false, connection: null, player: null });
    }

    const serverQueue = this.queue.get(guildId);
    serverQueue.songs.push(song);

    // Se não estiver tocando, inicia a reprodução
    if (!serverQueue.isPlaying) {
      serverQueue.isPlaying = true;
      await interaction.reply({ content: `🎶 **${song.title}** foi adicionada à fila!`, ephemeral: true });
      this.playNext(guildId, interaction);
    } else {
      await interaction.reply({ content: `🎶 **${song.title}** foi adicionada à fila!`, ephemeral: true });
    }
  }

  async playNext(guildId, interaction) {
    const serverQueue = this.queue.get(guildId);
    if (!serverQueue || serverQueue.songs.length === 0) {
      serverQueue.isPlaying = false;
      if (serverQueue.connection && serverQueue.connection.state.status !== 'destroyed') {
        serverQueue.connection.destroy();
      }
      return; // Se a fila estiver vazia, sair
    }

    const song = serverQueue.songs.shift(); // Retira a próxima música da fila

    // Entrar no canal de voz
    serverQueue.connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Reproduzir a música usando ytdl-core
    const stream = ytdl(song.url, { filter: 'audioonly' });

    stream.on('response', (response) => {
      if (response.statusCode === 403) {
        interaction.reply({
          content: 'Erro ao acessar o vídeo. Verifique as permissões do vídeo ou tente outro.',
          ephemeral: true,
        });
        if (serverQueue.connection.state.status !== 'destroyed') {
          serverQueue.connection.destroy();
        }
      }
    });

    const resource = createAudioResource(stream);
    serverQueue.player = createAudioPlayer();
    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);

    // Quando a música começar a tocar
    serverQueue.player.on(AudioPlayerStatus.Playing, () => {
      console.log(`Tocando: ${song.title}`);
      interaction.channel.send(`🎶 Tocando agora: **${song.title}**`);
    });

    // Quando a música terminar
    serverQueue.player.on(AudioPlayerStatus.Idle, () => {
      console.log('A música terminou.');
      this.playNext(guildId, interaction); // Toca a próxima música na fila
    });

    // Lidar com erros no player
    serverQueue.player.on('error', error => {
      console.error(`Erro no player: ${error.message}`);
      interaction.channel.send('Houve um erro ao tentar tocar a música.');
      if (serverQueue.connection.state.status !== 'destroyed') {
        serverQueue.connection.destroy();
      }
      this.playNext(guildId, interaction); // Tenta tocar a próxima música
    });
  }
}

module.exports = new CommandPlay();
