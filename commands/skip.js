module.exports = {
    name: 'skip',
    description: 'Pula a música atual.',
    async execute(message, distube) {
        const queue = distube.getQueue(message.guild.id);
        if (!queue) {
            console.log("Tentativa de pular a música, mas não há fila.");
            return message.reply("Não há músicas na fila.");
        }

        const currentSong = queue.songs[0];
        console.log(`Pulando a música: ${currentSong.name}`);
        await distube.skip(message.guild.id);
        
        if (queue.songs.length > 0) {
            message.reply("Música pulada. Próxima música na fila.");
        } else {
            message.reply("Música pulada. Não há mais músicas na fila.");
        }
    },
};
