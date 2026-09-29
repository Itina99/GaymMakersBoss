const { SlashCommandBuilder } = require('discord.js');

const {
    getDatabase,
    saveDatabase
} = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task-delete')
        .setDescription('Elimina una task esistente')
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('ID della task da eliminare')
                .setRequired(true)
                .setMinValue(1)
        )
        .addBooleanOption(option =>
            option
                .setName('conferma')
                .setDescription('Conferma definitivamente la cancellazione')
                .setRequired(true)
        ),

    async execute(interaction) {
            if (!interaction.memberPermissions.has('Administrator')) {
            await interaction.reply({
                content:
                    '❌ Non hai il permesso di amministratore necessario per eliminare una task.',
                ephemeral: true
            });

            return;
        }
        const taskId = interaction.options.getInteger('id');
        const confirm = interaction.options.getBoolean('conferma');

        const db = getDatabase();

        const result = db.exec(`
            SELECT
                id,
                title
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

        if (!confirm) {
            await interaction.reply({
                content:
                    `🛑 Cancellazione annullata.\n\n` +
                    `La task **#${taskId} — ${title}** non è stata eliminata.`,
                ephemeral: true
            });

            return;
        }

        db.run(`
            DELETE FROM tasks
            WHERE id = ?
        `, [taskId]);

        saveDatabase();

        await interaction.reply({
            content:
                `🗑️ Task **#${taskId} — ${title}** eliminata correttamente.`
        });
    }
};