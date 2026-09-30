const { SlashCommandBuilder } = require('discord.js');

const {
    getDatabase,
    saveDatabase
} = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-edit')
        .setDescription('Modifica una task esistente')

        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('ID della task da modificare')
                .setRequired(true)
                .setMinValue(1)
        )

        .addStringOption(option =>
            option
                .setName('titolo')
                .setDescription('Nuovo titolo della task')
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName('descrizione')
                .setDescription('Nuova descrizione della task')
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName('priorita')
                .setDescription('Nuova priorità')
                .setRequired(false)
                .addChoices(
                    { name: 'Low', value: 'Low' },
                    { name: 'Medium', value: 'Medium' },
                    { name: 'High', value: 'High' }
                )
        )

        .addStringOption(option =>
            option
                .setName('stato')
                .setDescription('Nuovo stato del lavoro')
                .setRequired(false)
                .addChoices(
                    { name: 'To do', value: 'To do' },
                    { name: 'In progress', value: 'In progress' },
                    { name: 'Done', value: 'Done' }
                )
        )

        .addStringOption(option =>
            option
                .setName('revisione')
                .setDescription('Nuovo stato della revisione')
                .setRequired(false)
                .addChoices(
                    { name: 'Finished', value: 'Finished' },
                    { name: 'In review', value: 'In review' },
                    { name: 'Approved', value: 'Approved' }
                )
        )

        .addStringOption(option =>
            option
                .setName('ruolo')
                .setDescription('Ruolo professionale richiesto')
                .setRequired(false)
                .addChoices(
                    { name: 'Programmer', value: 'Programmer' },
                    { name: 'Designer', value: 'Designer' },
                    { name: 'Manager', value: 'Manager' },
                    { name: 'Artist', value: 'Artist' },
                    { name: 'Sound', value: 'Sound' }
                )
        )

        .addUserOption(option =>
            option
                .setName('assegnatario')
                .setDescription('Nuovo assegnatario della task')
                .setRequired(false)
        ),

    async execute(interaction) {
        const taskId = interaction.options.getInteger('id');

        const title = interaction.options.getString('titolo');
        const description = interaction.options.getString('descrizione');
        const priority = interaction.options.getString('priorita');
        const workStatus = interaction.options.getString('stato');
        const reviewStatus = interaction.options.getString('revisione');
        const assignee = interaction.options.getUser('assegnatario');
        const role = interaction.options.getString('ruolo');

        const db = getDatabase();

        const existingTask = db.exec(`
            SELECT id
            FROM tasks
            WHERE id = ${taskId}
        `);

        if (
            existingTask.length === 0 ||
            existingTask[0].values.length === 0
        ) {
            await interaction.reply({
                content: `❌ Non esiste una task con ID ${taskId}.`,
                ephemeral: true
            });

            return;
        }

        const updates = [];
        const values = [];

        if (title !== null) {
            updates.push('title = ?');
            values.push(title);
        }

        if (description !== null) {
            updates.push('description = ?');
            values.push(description);
        }

        if (priority !== null) {
            updates.push('priority = ?');
            values.push(priority);
        }

        if (workStatus !== null) {
            updates.push('work_status = ?');
            values.push(workStatus);
        }

        if (reviewStatus !== null) {
            updates.push('review_status = ?');
            values.push(reviewStatus);
        }

        if (assignee !== null) {
            updates.push('assignee_id = ?');
            values.push(assignee.id);
        }

        if (role !== null) {
            updates.push('role = ?');
            values.push(role);
        }

        if (updates.length === 0) {
            await interaction.reply({
                content:
                    '⚠️ Non hai specificato nessun campo da modificare.',
                ephemeral: true
            });

            return;
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        values.push(taskId);

        db.run(`
            UPDATE tasks
            SET ${updates.join(', ')}
            WHERE id = ?
        `, values);

        saveDatabase();

        await interaction.reply({
            content:
                `✅ Task **#${taskId}** aggiornata correttamente.\n\n` +
                `Usa \`/task-view id:${taskId}\` per vedere le modifiche.`,
        });
    }
};