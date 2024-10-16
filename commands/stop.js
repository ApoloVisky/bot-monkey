module.exports = {
    name: 'stop',
    description: 'Para a música atual e limpa a fila.',
    async execute(message, distube) {
        const queue = distube.getQueue(message.guild.id);
        if (!queue) {
            console.log("Tentativa de parar a música, mas não há fila.");
            return message.reply("Não há músicas na fila.");
        }

        console.log(`Parando a música: ${queue.songs[0].name}`); 
        await distube.stop(message.guild.id);
        message.reply("Música parada e fila limpa.");
    },
};
