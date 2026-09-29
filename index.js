require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Collection
} = require('discord.js');

const {
    initializeDatabase
} = require('./database/database');

const pingCommand = require('./commands/ping');

const token = process.env.DISCORD_TOKEN?.trim();

if (!token) {
    throw new Error('DISCORD_TOKEN is missing from .env');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();

client.commands.set(
    pingCommand.data.name,
    pingCommand
);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Errore durante l'esecuzione di /${interaction.commandName}:`,
            error
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Si è verificato un errore.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Si è verificato un errore.',
                ephemeral: true
            });
        }
    }
});

async function startBot() {
    try {
        await initializeDatabase();

        console.log('Database inizializzato correttamente.');

        await client.login(token);

        console.log('Login Discord effettuato.');
    } catch (error) {
        console.error(
            'Errore durante l\'avvio del bot:',
            error
        );
    }
}

startBot();