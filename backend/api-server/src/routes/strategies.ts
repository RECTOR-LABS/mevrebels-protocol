import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { withCache } from '../services/redis';
import { Strategy, StrategyPerformance } from '../types';

export const strategyRoutes = Router();

// GET /api/strategies - List all strategies
strategyRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { status, creator, limit = '50', offset = '0' } = req.query;

    let sql = 'SELECT * FROM strategies WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (creator) {
      params.push(creator);
      sql += ` AND creator = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const cacheKey = `strategies:${status || 'all'}:${creator || 'all'}:${limit}:${offset}`;
    const result = await withCache(cacheKey, async () => {
      return await query<Strategy>(sql, params);
    }, 60); // Cache for 60s

    res.json({
      strategies: result.rows,
      total: result.rowCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// GET /api/strategies/:id - Get strategy by ID
strategyRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query<Strategy>(
      'SELECT * FROM strategies WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({ error: 'Failed to fetch strategy' });
  }
});

// GET /api/strategies/:id/stats - Get strategy performance stats
strategyRoutes.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cacheKey = `strategy:${id}:stats`;
    const stats = await withCache(cacheKey, async () => {
      const result = await query<StrategyPerformance>(
        'SELECT * FROM get_strategy_performance($1)',
        [id]
      );
      return result.rows[0];
    }, 300); // Cache for 5 minutes

    res.json(stats);
  } catch (error) {
    console.error('Error fetching strategy stats:', error);
    res.status(500).json({ error: 'Failed to fetch strategy stats' });
  }
});

// GET /api/strategies/:id/executions - Get strategy execution history
strategyRoutes.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const result = await query(
      `SELECT * FROM executions
       WHERE strategy_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      executions: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});
