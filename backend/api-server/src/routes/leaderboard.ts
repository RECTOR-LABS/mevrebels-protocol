import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { withCache } from '../services/redis';
import { LeaderboardEntry, CreatorEarnings } from '../types';

export const leaderboardRoutes = Router();

// GET /api/leaderboard - Top strategies
leaderboardRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const cacheKey = `leaderboard:${limit}`;
    const leaderboard = await withCache(cacheKey, async () => {
      const result = await query<LeaderboardEntry>(
        'SELECT * FROM get_leaderboard($1)',
        [limit]
      );
      return result.rows;
    }, 300); // Cache for 5 minutes

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/leaderboard/creators - Top creators by earnings
leaderboardRoutes.get('/creators', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const cacheKey = `leaderboard:creators:${limit}`;
    const creators = await withCache(cacheKey, async () => {
      const result = await query<CreatorEarnings>(
        `SELECT * FROM creator_earnings
         ORDER BY total_earnings_lamports DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    }, 300);

    res.json({ creators });
  } catch (error) {
    console.error('Error fetching creator leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch creator leaderboard' });
  }
});

// GET /api/leaderboard/creator/:pubkey - Get creator stats
leaderboardRoutes.get('/creator/:pubkey', async (req: Request, res: Response) => {
  try {
    const { pubkey } = req.params;

    const result = await query<CreatorEarnings>(
      'SELECT * FROM creator_earnings WHERE creator = $1',
      [pubkey]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching creator stats:', error);
    res.status(500).json({ error: 'Failed to fetch creator stats' });
  }
});
