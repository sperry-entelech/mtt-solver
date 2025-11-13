import { pool } from '../config/database';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import { GameState, GTOSolution } from './gtoSolver';

export class SolutionDatabase {
  /**
   * Generate a hash for a game state
   */
  public static generateGameStateHash(gameState: any): string {
    // Create a normalized representation of the game state
    const normalized = {
      street: gameState.street,
      pot: Math.round(gameState.pot),
      heroStack: Math.round(gameState.heroStack),
      villainStack: Math.round(gameState.villainStack),
      heroCards: gameState.heroCards?.map((c: any) => `${c.rank}${c.suit}`).sort().join(''),
      board: gameState.board?.map((c: any) => `${c.rank}${c.suit}`).sort().join(''),
      position: gameState.position,
      actionHistory: gameState.actionHistory?.join(',') || '',
    };

    const hashString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(hashString).digest('hex').substring(0, 16);
  }

  /**
   * Store a solution in the database
   */
  public static async storeSolution(
    hash: string,
    gameState: GameState,
    solution: GTOSolution
  ): Promise<void> {
    try {
      // Convert strategy Map to object
      const strategyObj: any = {};
      solution.strategy.forEach((value, key) => {
        strategyObj[key] = value;
      });

      const solutionData = {
        strategy: strategyObj,
        ev: solution.ev,
        exploitability: solution.exploitability,
        iterations: solution.iterations,
        convergence: solution.convergence,
      };

      await pool.query(
        `INSERT INTO gto_solutions (game_state_hash, solution, exploitability)
         VALUES ($1, $2, $3)
         ON CONFLICT (game_state_hash) 
         DO UPDATE SET solution = $2, exploitability = $3, updated_at = CURRENT_TIMESTAMP`,
        [hash, JSON.stringify(solutionData), solution.exploitability]
      );

      logger.debug('Solution stored', { hash, exploitability: solution.exploitability });
    } catch (error) {
      logger.error('Error storing solution', { error, hash });
      throw error;
    }
  }

  /**
   * Get a solution from the database
   */
  public static async getSolution(hash: string): Promise<GTOSolution | null> {
    try {
      const result = await pool.query(
        'SELECT solution FROM gto_solutions WHERE game_state_hash = $1',
        [hash]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const solutionData = result.rows[0].solution;

      // Convert strategy object back to Map
      const strategy = new Map<string, number>();
      Object.entries(solutionData.strategy || {}).forEach(([key, value]) => {
        strategy.set(key, value as number);
      });

      return {
        strategy,
        ev: solutionData.ev,
        exploitability: solutionData.exploitability,
        iterations: solutionData.iterations,
        convergence: solutionData.convergence,
      };
    } catch (error) {
      logger.error('Error retrieving solution', { error, hash });
      return null;
    }
  }

  /**
   * Check if a solution exists
   */
  public static async solutionExists(hash: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT 1 FROM gto_solutions WHERE game_state_hash = $1 LIMIT 1',
        [hash]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking solution existence', { error, hash });
      return false;
    }
  }

  /**
   * Get solution statistics
   */
  public static async getStatistics(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_solutions,
          AVG(exploitability) as avg_exploitability,
          MIN(exploitability) as min_exploitability,
          MAX(exploitability) as max_exploitability
        FROM gto_solutions
      `);

      return result.rows[0] || {
        total_solutions: 0,
        avg_exploitability: 0,
        min_exploitability: 0,
        max_exploitability: 0,
      };
    } catch (error) {
      logger.error('Error getting solution statistics', { error });
      return {
        total_solutions: 0,
        avg_exploitability: 0,
        min_exploitability: 0,
        max_exploitability: 0,
      };
    }
  }

  /**
   * Clean up old solutions (optional maintenance)
   */
  public static async cleanupOldSolutions(daysOld: number = 30): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM gto_solutions 
         WHERE updated_at < NOW() - INTERVAL '${daysOld} days'`
      );
      
      logger.info('Cleaned up old solutions', { deleted: result.rowCount });
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error cleaning up old solutions', { error });
      return 0;
    }
  }
}

