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

// GET /analytics/strategies/stats - Strategy statistics
analyticsRoutes.get('/strategies/stats', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'analytics:strategies:stats';
    const stats = await withCache(cacheKey, async () => {
      const strategiesResult = await query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM strategies'
      );

      const profitResult = await query(
        `SELECT
          SUM(profit_lamports) as total_profit,
          COUNT(*) as total_executions
         FROM executions WHERE success = true`
      );

      return {
        totalStrategies: parseInt(strategiesResult.rows[0].total) || 0,
        activeStrategies: parseInt(strategiesResult.rows[0].active) || 0,
        totalProfit: parseInt(profitResult.rows[0].total_profit) || 0,
        totalExecutions: parseInt(profitResult.rows[0].total_executions) || 0,
      };
    }, 300); // Cache for 5 minutes

    res.json(stats);
  } catch (error) {
    console.error('Error fetching strategy stats:', error);
    res.status(500).json({ error: 'Failed to fetch strategy statistics' });
  }
});

// GET /analytics/executions/stats - Execution statistics
analyticsRoutes.get('/executions/stats', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'analytics:executions:stats';
    const stats = await withCache(cacheKey, async () => {
      const result = await query(
        `SELECT
          COUNT(*) as total_executions,
          COUNT(*) FILTER (WHERE success = true) as successful_executions,
          COUNT(*) FILTER (WHERE success = false) as failed_executions,
          COALESCE(AVG(profit_lamports) FILTER (WHERE success = true), 0) as avg_profit,
          COALESCE(SUM(profit_lamports) FILTER (WHERE success = true), 0) as total_volume
         FROM executions`
      );

      return {
        totalExecutions: parseInt(result.rows[0].total_executions) || 0,
        successfulExecutions: parseInt(result.rows[0].successful_executions) || 0,
        failedExecutions: parseInt(result.rows[0].failed_executions) || 0,
        avgProfitPerExecution: parseFloat(result.rows[0].avg_profit) || 0,
        totalVolume: parseInt(result.rows[0].total_volume) || 0,
      };
    }, 300); // Cache for 5 minutes

    res.json(stats);
  } catch (error) {
    console.error('Error fetching execution stats:', error);
    res.status(500).json({ error: 'Failed to fetch execution statistics' });
  }
});

// GET /analytics/leaderboard - Top strategies and creators
analyticsRoutes.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'analytics:leaderboard';
    const leaderboard = await withCache(cacheKey, async () => {
      // Top strategies by profit
      const topStrategies = await query(
        `SELECT
          s.id as strategy_id,
          s.name,
          s.creator,
          COALESCE(SUM(e.profit_lamports), 0) as total_profit,
          COUNT(e.id) as execution_count,
          COALESCE(AVG(CASE WHEN e.success THEN 1.0 ELSE 0.0 END) * 100, 0) as success_rate
         FROM strategies s
         LEFT JOIN executions e ON e.strategy_id = s.id
         GROUP BY s.id, s.name, s.creator
         ORDER BY total_profit DESC
         LIMIT 10`
      );

      // Top creators by total profit
      const topCreators = await query(
        `SELECT
          s.creator,
          COUNT(DISTINCT s.id) as total_strategies,
          COALESCE(SUM(e.profit_lamports), 0) as total_profit,
          COALESCE(SUM(e.profit_lamports) * 0.30, 0) as total_earnings
         FROM strategies s
         LEFT JOIN executions e ON e.strategy_id = s.id AND e.success = true
         GROUP BY s.creator
         ORDER BY total_profit DESC
         LIMIT 10`
      );

      return {
        topStrategies: topStrategies.rows.map(row => ({
          strategyId: row.strategy_id,
          name: row.name,
          creator: row.creator,
          totalProfit: parseInt(row.total_profit),
          executionCount: parseInt(row.execution_count),
          successRate: parseFloat(row.success_rate).toFixed(2),
        })),
        topCreators: topCreators.rows.map(row => ({
          creator: row.creator,
          totalStrategies: parseInt(row.total_strategies),
          totalProfit: parseInt(row.total_profit),
          totalEarnings: parseInt(row.total_earnings),
        })),
      };
    }, 300); // Cache for 5 minutes

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
