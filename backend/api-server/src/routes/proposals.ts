import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { withCache } from '../services/redis';
import { Proposal, Vote } from '../types';

export const proposalRoutes = Router();

// GET /api/proposals - List all proposals
proposalRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    let sql = 'SELECT * FROM proposals WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const cacheKey = `proposals:${status || 'all'}:${limit}:${offset}`;
    const result = await withCache(cacheKey, async () => {
      return await query<Proposal>(sql, params);
    }, 60);

    res.json({
      proposals: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// GET /api/proposals/:id - Get proposal by ID
proposalRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query<Proposal>(
      'SELECT * FROM proposals WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

// GET /api/proposals/:id/votes - Get votes for proposal
proposalRoutes.get('/:id/votes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query<Vote>(
      `SELECT * FROM votes
       WHERE proposal_id = $1
       ORDER BY timestamp DESC`,
      [id]
    );

    res.json({
      votes: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});
