const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Controlla se il bot è online'),

    async execute(interaction) {
        await interaction.reply('🏓 Pong!');
    }
};