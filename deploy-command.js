require('dotenv').config();

const {
    REST,
    Routes
} = require('discord.js');

const pingCommand = require('./commands/ping');

const commands = [
    pingCommand.data.toJSON()
];

const rest = new REST({
    version: '10'
}).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log('Registrazione degli slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log('✅ Slash commands registrati.');
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
    }
}

deployCommands();