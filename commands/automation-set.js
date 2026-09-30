const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    getDatabase,
    saveDatabase
} = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automation-set')
        .setDescription('Configura un\'automazione del bot')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )

        .addStringOption(option =>
            option
                .setName('tipo')
                .setDescription('Tipo di automazione')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Riepilogo giornaliero',
                        value: 'daily_summary'
                    }
                )
        )

        .addChannelOption(option =>
            option
                .setName('canale')
                .setDescription('Canale in cui inviare il riepilogo')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('ora')
                .setDescription('Orario di esecuzione, formato HH:MM')
                .setRequired(true)
        )

        .addBooleanOption(option =>
            option
                .setName('attiva')
                .setDescription('Attiva o disattiva l\'automazione')
                .setRequired(true)
        ),

    async execute(interaction) {
        const type = interaction.options.getString('tipo');
        const channel = interaction.options.getChannel('canale');
        const time = interaction.options.getString('ora');
        const enabled = interaction.options.getBoolean('attiva');

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timeRegex.test(time)) {
            await interaction.reply({
                content:
                    '❌ L\'orario deve essere nel formato **HH:MM**, ad esempio `18:30`.',
                ephemeral: true
            });

            return;
        }

        if (!channel.isTextBased()) {
            await interaction.reply({
                content: '❌ Devi selezionare un canale testuale.',
                ephemeral: true
            });

            return;
        }

        const db = getDatabase();

        db.run(`
            INSERT INTO automation_settings (
                type,
                enabled,
                channel_id,
                time,
                last_run
            )
            VALUES (?, ?, ?, ?, NULL)
            ON CONFLICT(type)
            DO UPDATE SET
                enabled = excluded.enabled,
                channel_id = excluded.channel_id,
                time = excluded.time,
                last_run = NULL
        `, [
            type,
            enabled ? 1 : 0,
            channel.id,
            time
        ]);

        saveDatabase();

        const status = enabled
            ? '🟢 Attivata'
            : '🔴 Disattivata';

        await interaction.reply({
            content: [
                '⚙️ **Automazione configurata**',
                '',
                `**Tipo:** ${type}`,
                `**Canale:** <#${channel.id}>`,
                `**Orario:** ${time}`,
                `**Stato:** ${status}`
            ].join('\n'),
            ephemeral: true
        });
    }
};