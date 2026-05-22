import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlanError } from '../config/plans';
import { exportSummary, weeklyReview } from '../controllers/reportsController';

const router = Router();

function handlePlanError(err: unknown, res: Response) {
  if (err instanceof PlanError) {
    res.status(403).json({ error: err.message, code: err.code, requiredPlan: err.requiredPlan });
    return true;
  }
  return false;
}

router.post('/export-summary', async (req: AuthRequest, res: Response) => {
  try {
    const result = await exportSummary(req.userId!);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: 'Failed to generate export summary' });
  }
});

router.post('/weekly-review', async (req: AuthRequest, res: Response) => {
  try {
    const result = await weeklyReview(req.userId!);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: 'Failed to generate weekly review' });
  }
});

export default router;
