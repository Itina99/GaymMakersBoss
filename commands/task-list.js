const { SlashCommandBuilder } = require('discord.js');

const { getDatabase } = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-list')
        .setDescription('Mostra le task salvate nel database'),

    async execute(interaction) {
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                id,
                title,
                assignee_id,
                priority,
                work_status
            FROM tasks
            ORDER BY id DESC
            LIMIT 10
        `);

        // Nessuna task trovata
        if (result.length === 0 || result[0].values.length === 0) {
            await interaction.reply({
                content: '📭 Non ci sono task nel database.',
                ephemeral: true
            });

            return;
        }

        const columns = result[0].columns;
        const rows = result[0].values;

        const tasks = rows.map((row) => {
            const task = {};

            columns.forEach((column, index) => {
                task[column] = row[index];
            });

            return task;
        });

        const description = tasks.map((task) => {
            const assignee = task.assignee_id
                ? `<@${task.assignee_id}>`
                : 'Non assegnata';

            return [
                `### #${task.id} — ${task.title}`,
                `**Priorità:** ${task.priority}`,
                `**Stato:** ${task.work_status}`,
                `**Assegnatario:** ${assignee}`
            ].join('\n');
        }).join('\n\n');

        await interaction.reply({
            content: `📋 **Elenco delle task**\n\n${description}`,
            allowedMentions: {
                parse: []
            }
        });
    }
};