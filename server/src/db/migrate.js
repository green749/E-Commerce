import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, query, exec, closeDatabase } from './index.js';
import { logger } from '../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureMigrationTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function runMigrations() {
  await initDatabase();
  await ensureMigrationTable();

  const appliedResult = await query(`SELECT name FROM schema_migrations ORDER BY name ASC;`);
  const appliedMigrations = new Set(appliedResult.rows.map((r) => r.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (appliedMigrations.has(file)) {
      continue;
    }

    logger.info(`Applying migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    await exec(sql);
    await query(`INSERT INTO schema_migrations (name) VALUES ($1);`, [file]);
    logger.info(`Successfully applied migration: ${file}`);
    count++;
  }

  if (count === 0) {
    logger.info('No pending migrations. Database is up to date.');
  } else {
    logger.info(`Applied ${count} migration(s).`);
  }
}

export async function rollbackMigration() {
  await initDatabase();
  await ensureMigrationTable();

  const appliedResult = await query(
    `SELECT name FROM schema_migrations ORDER BY applied_at DESC, name DESC LIMIT 1;`
  );
  if (appliedResult.rows.length === 0) {
    logger.info('No migrations to rollback.');
    return;
  }

  const lastMigration = appliedResult.rows[0].name;
  const downFile = lastMigration.replace('.sql', '.down.sql');
  const downFilePath = path.join(migrationsDir, downFile);

  if (!fs.existsSync(downFilePath)) {
    throw new Error(`Rollback file not found: ${downFile}`);
  }

  logger.info(`Rolling back migration: ${lastMigration} using ${downFile}`);
  const sql = fs.readFileSync(downFilePath, 'utf-8');
  await exec(sql);
  await query(`DELETE FROM schema_migrations WHERE name = $1;`, [lastMigration]);
  logger.info(`Successfully rolled back migration: ${lastMigration}`);
}

export async function resetDatabase() {
  await initDatabase();
  await ensureMigrationTable();

  // Get all applied migrations in reverse
  const appliedResult = await query(
    `SELECT name FROM schema_migrations ORDER BY applied_at DESC, name DESC;`
  );
  for (const row of appliedResult.rows) {
    const migration = row.name;
    const downFile = migration.replace('.sql', '.down.sql');
    const downFilePath = path.join(migrationsDir, downFile);
    if (fs.existsSync(downFilePath)) {
      logger.info(`Rolling back: ${migration}`);
      const sql = fs.readFileSync(downFilePath, 'utf-8');
      await exec(sql);
      await query(`DELETE FROM schema_migrations WHERE name = $1;`, [migration]);
    }
  }

  logger.info('Re-applying all migrations...');
  await runMigrations();
}

// CLI handler
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'up';

  const run = async () => {
    if (command === 'down' || command === 'rollback') {
      await rollbackMigration();
    } else if (command === 'reset') {
      await resetDatabase();
    } else {
      await runMigrations();
    }
  };

  run()
    .then(async () => {
      await closeDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ error: err.message, stack: err.stack }, 'Migration command failed');
      await closeDatabase();
      process.exit(1);
    });
}
