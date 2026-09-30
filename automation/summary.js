const { getDatabase } = require('../database/database');

function generateDailySummary() {
    const db = getDatabase();

    // Totale task
    const totalResult = db.exec(`
        SELECT COUNT(*)
        FROM tasks
    `);

    const total = totalResult[0]?.values[0][0] || 0;


    // Stati
    const statusResult = db.exec(`
        SELECT
            work_status,
            COUNT(*)
        FROM tasks
        GROUP BY work_status
    `);

    const statuses = {
        'To do': 0,
        'In progress': 0,
        'Completed': 0
    };

    if (statusResult.length > 0) {
        for (const row of statusResult[0].values) {
            statuses[row[0]] = row[1];
        }
    }


    // Priorità
    const priorityResult = db.exec(`
        SELECT
            priority,
            COUNT(*)
        FROM tasks
        GROUP BY priority
    `);

    const priorities = {
        High: 0,
        Medium: 0,
        Low: 0,
        Ignored: 0
    };

    if (priorityResult.length > 0) {
        for (const row of priorityResult[0].values) {
            priorities[row[0]] = row[1];
        }
    }


    // Task High aperte
    const highResult = db.exec(`
        SELECT
            id,
            title,
            assignee_id
        FROM tasks
        WHERE
            priority = 'High'
        AND
            work_status != 'Completed'
        ORDER BY id DESC
        LIMIT 5
    `);


    let highTasks = [];

    if (highResult.length > 0) {
        highTasks = highResult[0].values;
    }


    const highSection = highTasks.length > 0
        ? highTasks.map(task => {
            const assignee = task[2]
                ? `<@${task[2]}>`
                : 'Non assegnata';

            return `🔴 #${task[0]} ${task[1]} — ${assignee}`;
        }).join('\n')
        : 'Nessuna task High aperta';

    // Task inattive da più di 3 giorni
    const inactiveResult = db.exec(`
        SELECT
            id,
            title,
            assignee_id,
            updated_at
        FROM tasks
        WHERE
            work_status != 'Completed'
        AND
            updated_at <= datetime('now', '-3 days')
        ORDER BY updated_at ASC
        LIMIT 5
    `);


    let inactiveTasks = [];

    if (inactiveResult.length > 0) {
        inactiveTasks = inactiveResult[0].values;
    }


    const inactiveSection = inactiveTasks.length > 0
        ? inactiveTasks.map(task => {

            const assignee = task[2]
                ? `<@${task[2]}>`
                : 'Non assegnata';

            const date = new Date(task[3])
                .toLocaleDateString('it-IT');

            return `⚠️ #${task[0]} ${task[1]} — ${assignee} (ultima modifica: ${date})`;

        }).join('\n')
        : 'Nessuna task inattiva';

    // Task raggruppate per assegnatario
    const memberResult = db.exec(`
        SELECT
            assignee_id,
            id,
            title
        FROM tasks
        WHERE
            work_status != 'Completed'
        AND
            assignee_id IS NOT NULL
        ORDER BY assignee_id, id DESC
    `);


    const members = {};

    if (memberResult.length > 0) {

        for (const row of memberResult[0].values) {

            const userId = row[0];

            if (!members[userId]) {
                members[userId] = [];
            }

            members[userId].push({
                id: row[1],
                title: row[2]
            });
        }
    }


    let membersSection = Object.keys(members).length > 0
        ? Object.entries(members)
            .map(([userId, tasks]) => {

                const taskList = tasks
                    .slice(0, 5)
                    .map(task =>
                        `- #${task.id} ${task.title}`
                    )
                    .join('\n');

                return [
                    `👤 <@${userId}>`,
                    taskList
                ].join('\n');

            })
            .join('\n\n')
        : 'Nessuna task assegnata';


    return [
        '📋 **Riepilogo giornaliero task**',
        '',
        `📌 Task totali: **${total}**`,
        '',
        '📂 **Stato lavoro**',
        `📝 To do: ${statuses['To do']}`,
        `🔄 In progress: ${statuses['In progress']}`,
        `✅ Completed: ${statuses['Completed']}`,
        '',
        '🚦 **Priorità**',
        `🔴 High: ${priorities.High}`,
        `🟡 Medium: ${priorities.Medium}`,
        `🟢 Low: ${priorities.Low}`,
        `⚪ Ignored: ${priorities.Ignored}`,
        '',
        '🔥 **High priority aperte**',
        highSection,
        '',
        '⚠️ **Task inattive (3+ giorni)**',
        inactiveSection,
        '',
        '👥 **Carico team**',
        membersSection
    ].join('\n');
}


module.exports = {
    generateDailySummary
};