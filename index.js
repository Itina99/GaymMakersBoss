require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Collection
} = require('discord.js');

const {
    initializeDatabase
} = require('./database/database');

const {
    initializeScheduler
} = require('./automation/scheduler');

const pingCommand = require('./commands/ping');
const taskCreateCommand = require('./commands/task-create');
const taskListCommand = require('./commands/task-list');
const taskViewCommand = require('./commands/task-view');
const taskEditCommand = require('./commands/task-edit');
const taskDeleteCommand = require('./commands/task-delete');
const taskStatusCommand = require('./commands/task-status');
const reviewStatusCommand = require('./commands/review-status');
const automationSetCommand = require('./commands/automation-set');

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

client.commands.set(
    taskCreateCommand.data.name,
    taskCreateCommand
);

client.commands.set(
    taskListCommand.data.name,
    taskListCommand
);

client.commands.set(
    taskViewCommand.data.name,
    taskViewCommand
);

client.commands.set(
    taskEditCommand.data.name,
    taskEditCommand
);

client.commands.set(
    taskDeleteCommand.data.name,
    taskDeleteCommand
);

client.commands.set(
    taskStatusCommand.data.name,
    taskStatusCommand
);

client.commands.set(
    reviewStatusCommand.data.name,
    reviewStatusCommand
);

client.commands.set(
    automationSetCommand.data.name,
    automationSetCommand
);

// Evento eseguito quando il bot è completamente connesso a Discord
client.once('clientReady', () => {
    console.log(`Bot online come ${client.user.tag}`);

    initializeScheduler(client);
});

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