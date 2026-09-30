const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const databasePath = path.join(__dirname, 'tasks.db');

let db;

async function initializeDatabase() {
    const SQL = await initSqlJs();

    if (fs.existsSync(databasePath)) {
        const fileBuffer = fs.readFileSync(databasePath);
        db = new SQL.Database(fileBuffer);

        console.log('Database SQLite caricato.');
    } else {
        db = new SQL.Database();

        console.log('Nuovo database SQLite creato.');
    }

    // Tabella delle task
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_by TEXT NOT NULL,
            assignee_id TEXT,
            role TEXT,
            priority TEXT NOT NULL DEFAULT 'Medium',
            work_status TEXT NOT NULL DEFAULT 'To do',
            review_status TEXT NOT NULL DEFAULT 'Finished',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migrazione della colonna role, se non esiste
    const tableInfo = db.exec(`
        PRAGMA table_info(tasks)
    `);

    const columns = tableInfo.length > 0
        ? tableInfo[0].values
        : [];

    const hasRoleColumn = columns.some(
        column => column[1] === 'role'
    );

    if (!hasRoleColumn) {
        db.run(`
            ALTER TABLE tasks
            ADD COLUMN role TEXT
        `);

        console.log('Colonna role aggiunta alla tabella tasks.');
    }

    // Tabella per le automazioni
    db.run(`
        CREATE TABLE IF NOT EXISTS automation_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL UNIQUE,
            enabled INTEGER NOT NULL DEFAULT 0,
            channel_id TEXT,
            time TEXT,
            last_run TEXT
        )
    `);

    saveDatabase();

    console.log('Tabelle database pronte.');
}

function saveDatabase() {
    if (!db) {
        throw new Error('Database non inizializzato.');
    }

    const data = db.export();

    fs.writeFileSync(databasePath, Buffer.from(data));
}

function getDatabase() {
    if (!db) {
        throw new Error('Database non inizializzato.');
    }

    return db;
}

module.exports = {
    initializeDatabase,
    saveDatabase,
    getDatabase
};