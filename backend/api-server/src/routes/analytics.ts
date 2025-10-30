import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { withCache } from '../services/redis';
import { AnalyticsOverview } from '../types';

export const analyticsRoutes = Router();

// GET /api/analytics/overview - Protocol-wide metrics
analyticsRoutes.get('/overview', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'analytics:overview';
    const overview = await withCache(cacheKey, async () => {
      const [strategies, executions, proposals] = await Promise.all([
        query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM strategies'),
        query('SELECT COUNT(*) as total, SUM(profit_lamports) as volume FROM executions WHERE success = true'),
        query('SELECT COUNT(*) FILTER (WHERE status = \'active\') as active FROM proposals'),
      ]);

      const creators = await query('SELECT COUNT(DISTINCT creator) as total FROM strategies');
      const executors = await query('SELECT COUNT(DISTINCT executor) as total FROM executions');

      return {
        total_strategies: parseInt(strategies.rows[0].total),
        active_strategies: parseInt(strategies.rows[0].active),
        total_executions: parseInt(executions.rows[0].total),
        total_volume_lamports: parseInt(executions.rows[0].volume || '0'),
        total_creators: parseInt(creators.rows[0].total),
        total_executors: parseInt(executors.rows[0].total),
        active_proposals: parseInt(proposals.rows[0].active),
      };
    }, 300); // Cache for 5 minutes

    res.json(overview);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/chart/executions - Execution time series data
analyticsRoutes.get('/chart/executions', async (req: Request, res: Response) => {
  try {
    const { interval = '1h', limit = '24' } = req.query;

    const result = await query(
      `SELECT
        time_bucket($1::interval, timestamp) AS bucket,
        COUNT(*) as count,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
        SUM(profit_lamports) as total_profit
       FROM executions
       WHERE timestamp > NOW() - ($1::interval * $2::integer)
       GROUP BY bucket
       ORDER BY bucket DESC`,
      [interval, limit]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching execution chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});
