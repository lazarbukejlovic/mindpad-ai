import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { SavedExecutionPlan } from '../models/SavedExecutionPlan';
import { PLAN_CONFIG, Plan, PlanError } from '../config/plans';

const router = Router();

function handlePlanError(err: unknown, res: Response) {
  if (err instanceof PlanError) {
    res.status(403).json({ error: err.message, code: err.code, requiredPlan: err.requiredPlan });
    return true;
  }
  return false;
}

async function requireExecutionPlanAccess(userId: string) {
  const user = await User.findById(userId);
  const plan = (user?.plan as Plan) || 'free';
  if (!PLAN_CONFIG[plan].canSaveExecutionPlans) {
    throw new PlanError('Saved execution plans require a Pro or Team plan', 'UPGRADE_REQUIRED', 'pro');
  }
  return plan;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    await requireExecutionPlanAccess(req.userId!);
    const plans = await SavedExecutionPlan.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(plans.map(p => ({
      id: p._id.toString(),
      title: p.title,
      summary: p.summary,
      steps: p.steps,
      source: p.source,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: 'Failed to fetch execution plans' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, summary, steps, source } = req.body as {
    title?: string; summary?: string; steps?: string[]; source?: string;
  };
  if (!title?.trim()) { res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' }); return; }
  try {
    await requireExecutionPlanAccess(req.userId!);
    const plan = new SavedExecutionPlan({
      userId: req.userId,
      title: title.trim(),
      summary: summary?.trim() || '',
      steps: Array.isArray(steps) ? steps.filter(Boolean) : [],
      source: source || 'manual',
    });
    await plan.save();
    res.status(201).json({
      id: plan._id.toString(),
      title: plan.title,
      summary: plan.summary,
      steps: plan.steps,
      source: plan.source,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    });
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: 'Failed to save execution plan' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await requireExecutionPlanAccess(req.userId!);
    const result = await SavedExecutionPlan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) { res.status(404).json({ error: 'Plan not found', code: 'NOT_FOUND' }); return; }
    res.status(204).send();
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: 'Failed to delete execution plan' });
  }
});

export default router;
