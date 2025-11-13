-- UP
-- Initial database schema migration
-- This migration creates all base tables if they don't exist

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
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  players JSONB NOT NULL,
  stacks INTEGER[] NOT NULL,
  blinds JSONB NOT NULL,
  position VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hands table
CREATE TABLE IF NOT EXISTS hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
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
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
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

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GTO Solutions table (for pre-solved solutions)
CREATE TABLE IF NOT EXISTS gto_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_hash VARCHAR(64) UNIQUE NOT NULL,
  solution JSONB NOT NULL,
  exploitability DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_tournament_id ON scenarios(tournament_id);
CREATE INDEX IF NOT EXISTS idx_hands_scenario_id ON hands(scenario_id);
CREATE INDEX IF NOT EXISTS idx_results_scenario_id ON results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_ranges_position ON ranges(position);
CREATE INDEX IF NOT EXISTS idx_hand_histories_tournament ON hand_histories(tournament_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_gto_solutions_hash ON gto_solutions(game_state_hash);

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

CREATE TRIGGER update_gto_solutions_updated_at BEFORE UPDATE
    ON gto_solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_gto_solutions_updated_at ON gto_solutions;
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP INDEX IF EXISTS idx_gto_solutions_hash;
DROP INDEX IF EXISTS idx_user_sessions_expires;
DROP INDEX IF EXISTS idx_hand_histories_tournament;
DROP INDEX IF EXISTS idx_ranges_position;
DROP INDEX IF EXISTS idx_results_scenario_id;
DROP INDEX IF EXISTS idx_hands_scenario_id;
DROP INDEX IF EXISTS idx_scenarios_tournament_id;

DROP TABLE IF EXISTS gto_solutions;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS hand_histories;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS ranges;
DROP TABLE IF EXISTS hands;
DROP TABLE IF EXISTS scenarios;
DROP TABLE IF EXISTS tournaments;

