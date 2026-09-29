const {
    initializeDatabase,
    getDatabase,
    saveDatabase
} = require('./database');

async function test() {
    await initializeDatabase();

    const db = getDatabase();

    // Inseriamo una task di prova
    db.run(`
        INSERT INTO tasks (
            title,
            description,
            created_by,
            priority,
            work_status,
            review_status
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        'Task di prova',
        'Questa è una task utilizzata per testare il database.',
        '123456789',
        'High',
        'To do',
        'Finished'
    ]);

    saveDatabase();

    console.log('Task inserita correttamente.');

    // Leggiamo tutte le task
    const result = db.exec(`
        SELECT *
        FROM tasks
    `);

    console.log('Task presenti nel database:');
    console.log(result);
}

test().catch((error) => {
    console.error('Errore durante il test:', error);
});