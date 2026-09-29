
const { SlashCommandBuilder } = require('discord.js');

const { getDatabase } = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-view')
        .setDescription('Mostra tutti i dettagli di una task')
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('ID della task da visualizzare')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const taskId = interaction.options.getInteger('id');
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                id,
                title,
                description,
                created_by,
                assignee_id,
                priority,
                work_status,
                review_status,
                created_at,
                updated_at
            FROM tasks
            WHERE id = ${taskId}
        `);

        if (result.length === 0 || result[0].values.length === 0) {
            await interaction.reply({
                content: `❌ Non esiste una task con ID ${taskId}.`,
                ephemeral: true
            });
            return;
        }

        const columns = result[0].columns;
        const values = result[0].values[0];

        const task = {};
        columns.forEach((column, index) => {
            task[column] = values[index];
        });

        const author = `<@${task.created_by}>`;
        const assignee = task.assignee_id
            ? `<@${task.assignee_id}>`
            : 'Non assegnata';

        await interaction.reply({
            content: [
                `## 📋 Task #${task.id} — ${task.title}`,
                `**Descrizione:** ${task.description}`,
                `**Creata da:** ${author}`,
                `**Assegnatario:** ${assignee}`,
                `**Priorità:** ${task.priority}`,
                `**Stato del lavoro:** ${task.work_status}`,
                `**Stato della revisione:** ${task.review_status}`,
                `**Creata il:** ${task.created_at}`,
                `**Ultimo aggiornamento:** ${task.updated_at}`
            ].join('\n'),
            allowedMentions: {
                parse: []
            }
        });
    }
};
