require('dotenv').config();

const {
    REST,
    Routes
} = require('discord.js');

const pingCommand = require('./commands/ping');
const taskCreateCommand = require('./commands/task-create');
const taskListCommand = require('./commands/task-list');
const taskViewCommand = require('./commands/task-view');
const taskEditCommand = require('./commands/task-edit');
const taskDeleteCommand = require('./commands/task-delete');
const taskStatusCommand = require('./commands/task-status');
const reviewStatusCommand = require('./commands/review-status');

const commands = [
    pingCommand.data.toJSON(),
    taskCreateCommand.data.toJSON(),
    taskListCommand.data.toJSON(),
    taskViewCommand.data.toJSON(),
    taskEditCommand.data.toJSON(),
    taskDeleteCommand.data.toJSON(),
    taskStatusCommand.data.toJSON(),
    reviewStatusCommand.data.toJSON()
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