const { SlashCommandBuilder } = require('discord.js')



class CommandModel {

    data = new SlashCommandBuilder()

    async execute(...args) {

    }
}

module.exports = CommandModel