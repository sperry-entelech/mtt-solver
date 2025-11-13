import { Pool } from 'pg';
import { pool } from './database';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

class MigrationManager {
  private migrations: Migration[] = [];
  private currentVersion: number = 0;

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations(): void {
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      logger.warn('Migrations directory does not exist, creating it...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    files.forEach(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const [up, down] = content.split('-- DOWN').map(s => s.replace(/-- UP\n?/, '').trim());
      
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (match) {
        this.migrations.push({
          version: parseInt(match[1]),
          name: match[2],
          up,
          down: down || '',
        });
      }
    });

    logger.info(`Loaded ${this.migrations.length} migrations`);
  }

  public async getCurrentVersion(): Promise<number> {
    try {
      // Create migrations table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await pool.query(
        'SELECT MAX(version) as version FROM schema_migrations'
      );
      
      return result.rows[0]?.version || 0;
    } catch (error) {
      logger.error('Error getting current migration version', { error });
      throw error;
    }
  }

  public async migrate(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Running ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        logger.info(`Running migration ${migration.version}: ${migration.name}`);
        
        await pool.query('BEGIN');
        try {
          await pool.query(migration.up);
          await pool.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [migration.version, migration.name]
          );
          await pool.query('COMMIT');
          
          logger.info(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          await pool.query('ROLLBACK');
          logger.error(`Migration ${migration.version} failed`, { error });
          throw error;
        }
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', { error });
      throw error;
    }
  }

  public async rollback(targetVersion?: number): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const target = targetVersion || Math.max(0, currentVersion - 1);
      
      if (target >= currentVersion) {
        logger.info('No rollback needed');
        return;
      }

      const migrationsToRollback = this.migrations
        .filter(m => m.version > target && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version);

      logger.info(`Rolling back ${migrationsToRollback.length} migrations...`);

      for (const migration of migrationsToRollback) {
        if (!migration.down) {
          logger.warn(`Migration ${migration.version} has no rollback script, skipping`);
          continue;
        }

        logger.info(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        await pool.query('BEGIN');
        try {
          await pool.query(migration.down);
          await pool.query('DELETE FROM schema_migrations WHERE version = $1', [migration.version]);
          await pool.query('COMMIT');
          
          logger.info(`Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          await pool.query('ROLLBACK');
          logger.error(`Rollback of migration ${migration.version} failed`, { error });
          throw error;
        }
      }

      logger.info('Rollback completed successfully');
    } catch (error) {
      logger.error('Rollback failed', { error });
      throw error;
    }
  }

  public async createMigration(name: string): Promise<string> {
    const timestamp = Date.now();
    const version = Math.floor(timestamp / 1000);
    const fileName = `${version}_${name}.sql`;
    const filePath = path.join(__dirname, '../migrations', fileName);

    const template = `-- UP
-- Add your migration SQL here

-- DOWN
-- Add your rollback SQL here
`;

    fs.writeFileSync(filePath, template);
    logger.info(`Created migration file: ${fileName}`);
    
    return filePath;
  }
}

export const migrationManager = new MigrationManager();

// CLI commands
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  (async () => {
    try {
      switch (command) {
        case 'migrate':
          await migrationManager.migrate();
          process.exit(0);
          break;
        case 'rollback':
          await migrationManager.rollback(arg ? parseInt(arg) : undefined);
          process.exit(0);
          break;
        case 'create':
          if (!arg) {
            console.error('Usage: npm run migration:create <name>');
            process.exit(1);
          }
          await migrationManager.createMigration(arg);
          process.exit(0);
          break;
        default:
          console.log('Usage: npm run migration:<command> [args]');
          console.log('Commands: migrate, rollback [version], create <name>');
          process.exit(1);
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  })();
}

