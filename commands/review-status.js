const { SlashCommandBuilder } = require('discord.js');

const {
    getDatabase,
    saveDatabase
} = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review-status')
        .setDescription('Modifica lo stato della revisione di una task')

        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('ID della task')
                .setRequired(true)
                .setMinValue(1)
        )

        .addStringOption(option =>
            option
                .setName('stato')
                .setDescription('Nuovo stato della revisione')
                .setRequired(true)
                .addChoices(
                    { name: 'Finished', value: 'Finished' },
                    { name: 'In review', value: 'In review' },
                    { name: 'Approved', value: 'Approved' }
                )
        ),

    async execute(interaction) {
        const taskId = interaction.options.getInteger('id');
        const newStatus = interaction.options.getString('stato');

        const db = getDatabase();

        const result = db.exec(`
            SELECT
                id,
                title,
                review_status
            FROM tasks
            WHERE id = ${taskId}
        `);

        if (
            result.length === 0 ||
            result[0].values.length === 0
        ) {
            await interaction.reply({
                content: `❌ Non esiste una task con ID ${taskId}.`,
                ephemeral: true
            });

            return;
        }

        const title = result[0].values[0][1];
        const oldStatus = result[0].values[0][2];

        if (oldStatus === newStatus) {
            await interaction.reply({
                content:
                    `ℹ️ La revisione della task ` +
                    `**#${taskId} — ${title}** ` +
                    `è già nello stato **${newStatus}**.`,
                ephemeral: true
            });

            return;
        }

        db.run(`
            UPDATE tasks
            SET
                review_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            newStatus,
            taskId
        ]);

        saveDatabase();

        await interaction.reply({
            content:
                `🔎 Revisione della task **#${taskId} — ${title}** aggiornata.\n\n` +
                `**Stato precedente:** ${oldStatus}\n` +
                `**Nuovo stato:** ${newStatus}`
        });
    }
};