module.exports = {
  name: "play",
  description: "Toca uma música.",
  async execute(interaction, distube) {
    try {
      const songName = interaction.options.getString("song");
      const voiceChannel = interaction.member.voice.channel;

   
      if (!voiceChannel) {
        return interaction.reply({
          content: "Você precisa estar em um canal de voz para tocar música!",
          ephemeral: true,
        });
      }

 
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

      
      await distube.play(voiceChannel, songName, {
        textChannel: interaction.channel,
        member: interaction.member,
      });

    
      if (interaction.deferred) {
        await interaction.editReply(`🎶 Tocando agora: **${songName}**`);
      }
    } catch (error) {
      console.error("Erro ao executar o comando:", error);

      
      if (!interaction.replied) {
        await interaction.editReply("Houve um erro ao tentar tocar a música.");
      }
    }
  },
};
