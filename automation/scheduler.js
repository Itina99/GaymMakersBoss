const { getDatabase } = require('../database/database');

let client;

function initializeScheduler(discordClient) {
    client = discordClient;

    console.log('Scheduler automazioni avviato.');

    // Controlla le automazioni ogni minuto
    checkAutomations();

    setInterval(() => {
        checkAutomations();
    }, 60 * 1000);
}

function checkAutomations() {
    try {
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                id,
                type,
                enabled,
                channel_id,
                time,
                last_run
            FROM automation_settings
            WHERE enabled = 1
        `);

        if (result.length === 0 || result[0].values.length === 0) {
            return;
        }

        const columns = result[0].columns;
        const rows = result[0].values;

        const automations = rows.map((row) => {
            const automation = {};

            columns.forEach((column, index) => {
                automation[column] = row[index];
            });

            return automation;
        });

        const now = new Date();

        const currentTime = now.toTimeString().slice(0, 5);
        const currentDate = now.toISOString().slice(0, 10);

        for (const automation of automations) {
            if (!automation.time) {
                continue;
            }

            if (automation.time !== currentTime) {
                continue;
            }

            // Evita di eseguire la stessa automazione
            // più volte nello stesso giorno.
            if (automation.last_run === currentDate) {
                continue;
            }

            executeAutomation(automation, currentDate);
        }

    } catch (error) {
        console.error(
            'Errore nello scheduler delle automazioni:',
            error
        );
    }
}

async function executeAutomation(automation, currentDate) {
    try {
        console.log(
            `Esecuzione automazione: ${automation.type}`
        );

        if (!automation.channel_id) {
            console.warn(
                `Automazione ${automation.type} senza channel_id.`
            );

            return;
        }

        const channel = await client.channels.fetch(
            automation.channel_id
        );

        if (!channel) {
            console.warn(
                `Canale non trovato per automazione ${automation.type}.`
            );

            return;
        }

        // Per ora inviamo un messaggio di test.
        const { generateDailySummary } = require('./summary');

        let message;

        if (automation.type === 'daily_summary') {
            message = generateDailySummary();
        } else {
            message = `🤖 Automazione ${automation.type} eseguita.`;
        }

        await channel.send(message);

        const db = getDatabase();

        db.run(`
            UPDATE automation_settings
            SET last_run = ?
            WHERE id = ?
        `, [
            currentDate,
            automation.id
        ]);

        const { saveDatabase } = require('../database/database');

        saveDatabase();

        console.log(
            `Automazione ${automation.type} completata.`
        );

    } catch (error) {
        console.error(
            `Errore nell'automazione ${automation.type}:`,
            error
        );
    }
}

module.exports = {
    initializeScheduler
};