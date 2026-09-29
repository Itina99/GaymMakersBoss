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

    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_by TEXT NOT NULL,
            assignee_id TEXT,
            priority TEXT NOT NULL DEFAULT 'Medium',
            work_status TEXT NOT NULL DEFAULT 'To do',
            review_status TEXT NOT NULL DEFAULT 'Finished',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    saveDatabase();

    console.log('Tabella tasks pronta.');
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