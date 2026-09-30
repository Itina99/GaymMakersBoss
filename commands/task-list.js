
const { SlashCommandBuilder } = require('discord.js');
const { getDatabase } = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-list')
        .setDescription('Mostra le task salvate nel database')

        .addUserOption(option =>
            option
                .setName('assegnatario')
                .setDescription('Filtra per membro assegnatario')
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName('ruolo')
                .setDescription('Filtra per ruolo professionale')
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
                .setName('stato')
                .setDescription('Filtra per stato della task')
                .setRequired(false)
                .addChoices(
                    { name: 'To do', value: 'To do' },
                    { name: 'In progress', value: 'In progress' },
                    { name: 'Done', value: 'Done' }
                )
        )

        .addStringOption(option =>
            option
                .setName('priorita')
                .setDescription('Filtra per priorità')
                .setRequired(false)
                .addChoices(
                    { name: 'High', value: 'High' },
                    { name: 'Medium', value: 'Medium' },
                    { name: 'Low', value: 'Low' }
                )
        ),

    async execute(interaction) {
        const db = getDatabase();

        // Recupera i filtri selezionati
        const assigneeId = interaction.options
            .getUser('assegnatario')?.id;

        const role = interaction.options.getString('ruolo');
        const status = interaction.options.getString('stato');
        const priority = interaction.options.getString('priorita');

        // Costruisci la query in base ai filtri
        const conditions = [];
        const params = [];

        if (assigneeId) {
            conditions.push('assignee_id = ?');
            params.push(assigneeId);
        }

        if (role) {
            conditions.push('role = ?');
            params.push(role);
        }

        if (status) {
            conditions.push('work_status = ?');
            params.push(status);
        }

        if (priority) {
            conditions.push('priority = ?');
            params.push(priority);
        }

        let query = `
            SELECT
                id,
                title,
                assignee_id,
                role,
                priority,
                work_status
            FROM tasks
        `;

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += `
            ORDER BY
                CASE priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                    ELSE 4
                END,
                id DESC
            LIMIT 10
        `;

        const result = db.exec(query, params);

        // Nessuna task trovata
        if (result.length === 0 || result[0].values.length === 0) {
            await interaction.reply({
                content: '📭 Nessuna task trovata con i filtri selezionati.',
                ephemeral: true
            });

            return;
        }

        // Converti i risultati in oggetti task
        const columns = result[0].columns;
        const rows = result[0].values;

        const tasks = rows.map((row) => {
            const task = {};

            columns.forEach((column, index) => {
                task[column] = row[index];
            });

            return task;
        });

        // Formatta la lista
        const description = tasks.map((task) => {
            const assignee = task.assignee_id
                ? `<@${task.assignee_id}>`
                : 'Non assegnata';

            const priorityEmoji = {
                High: '🔴',
                Medium: '🟡',
                Low: '🟢'
            }[task.priority] || '⚪';

            return [
                `### #${task.id} — ${task.title}`,
                `**Priorità:** ${priorityEmoji} ${task.priority}`,
                `**Stato:** ${task.work_status}`,
                `**Ruolo:** ${task.role || 'Non specificato'}`,
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
