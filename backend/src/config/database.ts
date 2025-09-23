import { Pool } from 'pg';
import { Redis } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mtt_poker_solver',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Redis configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Redis client
export const redisClient = Redis.createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    console.log('✓ PostgreSQL connected successfully');
    client.release();

    // Create tables if they don't exist
    await createTables();

    // Test Redis connection
    await redisClient.connect();
    console.log('✓ Redis connected successfully');

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const createTablesSQL = `
    -- Tournaments table
    CREATE TABLE IF NOT EXISTS tournaments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      structure JSONB NOT NULL,
      payouts DECIMAL[] NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Scenarios table
    CREATE TABLE IF NOT EXISTS scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tournament_id UUID REFERENCES tournaments(id),
      players JSONB NOT NULL,
      stacks INTEGER[] NOT NULL,
      blinds JSONB NOT NULL,
      position VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Hands table
    CREATE TABLE IF NOT EXISTS hands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scenario_id UUID REFERENCES scenarios(id),
      hole_cards VARCHAR(4) NOT NULL,
      board VARCHAR(10),
      action VARCHAR(20) NOT NULL,
      result JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ranges table
    CREATE TABLE IF NOT EXISTS ranges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      position VARCHAR(10) NOT NULL,
      range_string TEXT NOT NULL,
      description TEXT,
      hands TEXT[] NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Results table
    CREATE TABLE IF NOT EXISTS results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scenario_id UUID REFERENCES scenarios(id),
      optimal_action VARCHAR(20) NOT NULL,
      equity DECIMAL(5,4) NOT NULL,
      ev DECIMAL(10,2) NOT NULL,
      confidence DECIMAL(3,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Hand histories table
    CREATE TABLE IF NOT EXISTS hand_histories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tournament_name VARCHAR(255),
      hand_number INTEGER,
      datetime TIMESTAMP,
      players JSONB NOT NULL,
      actions JSONB NOT NULL,
      result JSONB,
      analysis JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- User sessions table (for caching calculations)
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_data JSONB NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_scenarios_tournament_id ON scenarios(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_hands_scenario_id ON hands(scenario_id);
    CREATE INDEX IF NOT EXISTS idx_results_scenario_id ON results(scenario_id);
    CREATE INDEX IF NOT EXISTS idx_ranges_position ON ranges(position);
    CREATE INDEX IF NOT EXISTS idx_hand_histories_tournament ON hand_histories(tournament_name);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

    -- Update triggers for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE
        ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(createTablesSQL);
    console.log('✓ Database tables created/verified successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Cache utilities
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    await redisClient.quit();
    console.log('✓ Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}