import { Router, Response } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const summary = await getAnalyticsSummary(req.userId);
    res.status(200).json(summary);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get analytics';
    res.status(400).json({ error: message });
  }
});

export default router;
