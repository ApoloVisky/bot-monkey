const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);


  if (!commands.some(cmd => cmd.data.name === command.data.name)) {
    commands.push(command);
  } else {
    console.warn(`Comando duplicado encontrado: ${command.data.name}. Removido da lista.`);
  }
}
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Começando a registrar comandos de aplicação globalmente...');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands.map(command => command.data.toJSON()),
    });

    console.log('Comandos registrados com sucesso globalmente!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();
