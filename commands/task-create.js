const { SlashCommandBuilder } = require('discord.js');

const {
    getDatabase,
    saveDatabase
} = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-create')
        .setDescription('Crea una nuova task')

        .addStringOption(option =>
            option
                .setName('titolo')
                .setDescription('Titolo della task')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('descrizione')
                .setDescription('Descrizione della task')
                .setRequired(true)
        )

        .addUserOption(option =>
            option
                .setName('assegnatario')
                .setDescription('Utente a cui assegnare la task')
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName('ruolo')
                .setDescription('Ruolo professionale richiesto per la task')
                .setRequired(false)
                .addChoices(
                    { name: 'Programmer', value: 'Programmer' },
                    { name: 'Designer', value: 'Designer' },
                    { name: 'Manager', value: 'Manager' },
                    { name: 'Artist', value: 'Artist' },
                    { name: 'Sound', value: 'Sound' }
                )
        )
        

        .addStringOption(option =>
            option
                .setName('priorita')
                .setDescription('Priorità della task')
                .setRequired(false)
                .addChoices(
                    { name: 'Low', value: 'Low' },
                    { name: 'Medium', value: 'Medium' },
                    { name: 'High', value: 'High' }
                )
        ),

    async execute(interaction) {
        const title = interaction.options.getString('titolo');
        const description = interaction.options.getString('descrizione');
        const assignee = interaction.options.getUser('assegnatario');
        const role = interaction.options.getString('ruolo');
        const priority = interaction.options.getString('priorita') || 'Medium';

        const db = getDatabase();

        db.run(`
            INSERT INTO tasks (
                title,
                description,
                created_by,
                assignee_id,
                role,
                priority
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            title,
            description,
            interaction.user.id,
            assignee ? assignee.id : null,
            role,
            priority
        ]);

        saveDatabase();

        const assigneeText = assignee
            ? `<@${assignee.id}>`
            : 'Non assegnata';

        const roleText = role || 'Nessun ruolo specificato';

        await interaction.reply({
            content:
                `✅ Task creata!\n\n` +
                `**Titolo:** ${title}\n` +
                `**Descrizione:** ${description}\n` +
                `**Creata da:** ${interaction.user}\n` +
                `**Assegnatario:** ${assigneeText}\n` +
                `**Ruolo:** ${roleText}\n` +
                `**Priorità:** ${priority}`
        });
    }
};