import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'database', 'trading.db');
const BACKUP_DIR = path.join(process.cwd(), 'database', 'backups');
const MIGRATIONS_DIR = path.join(process.cwd(), 'database', 'migrations');

export function runMigrations() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(MIGRATIONS_DIR)) fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

  // 1. Create a backup before any changes
  if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `trading-${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ Backup created at: ${backupPath}`);
  }

  const db = new Database(DB_PATH);

  // 2. Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Get applied migrations
  const appliedMigrations = new Set(
    (db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((m) => m.name)
  );

  // 4. Read migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (!appliedMigrations.has(file)) {
      console.log(`🚀 Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      const transaction = db.transaction(() => {
        db.exec(sql);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      });

      transaction();
      console.log(`✅ Migration ${file} applied.`);
      count++;
    }
  }

  if (count === 0) {
    console.log('✨ No pending migrations.');
  } else {
    console.log(`🎉 Finished applying ${count} migrations.`);
  }

  db.close();
}

// If run directly
if (require.main === module) {
  runMigrations();
}
