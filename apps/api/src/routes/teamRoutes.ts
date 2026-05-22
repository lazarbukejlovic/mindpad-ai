import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlanError } from '../config/plans';
import {
  getTeamWorkspace,
  createTeamWorkspace,
  updateTeamWorkspace,
  inviteTeamMember,
  removeInvite,
  addSharedProject,
  deleteSharedProject,
  addActivity,
  generateTeamWeeklyReport,
} from '../controllers/teamController';

const router = Router();

function handlePlanError(err: unknown, res: Response) {
  if (err instanceof PlanError) {
    res.status(403).json({ error: err.message, code: err.code, requiredPlan: err.requiredPlan });
    return true;
  }
  return false;
}

router.get('/workspace', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getTeamWorkspace(req.userId!);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get workspace' });
  }
});

// Keep GET / as alias for backward compatibility
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getTeamWorkspace(req.userId!);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get workspace' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Workspace name is required' }); return; }
  try {
    const workspace = await createTeamWorkspace(req.userId!, name.trim());
    res.status(201).json(workspace);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create workspace' });
  }
});

router.patch('/workspace', async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await updateTeamWorkspace(req.userId!, req.body);
    res.json(workspace);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update workspace' });
  }
});

// Keep PATCH / as alias
router.patch('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await updateTeamWorkspace(req.userId!, req.body);
    res.json(workspace);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update workspace' });
  }
});

router.post('/invite', async (req: AuthRequest, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) { res.status(400).json({ error: 'Email is required' }); return; }
  try {
    const result = await inviteTeamMember(req.userId!, email.trim());
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to invite member' });
  }
});

router.delete('/invite', async (req: AuthRequest, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) { res.status(400).json({ error: 'Email is required' }); return; }
  try {
    const result = await removeInvite(req.userId!, email.trim());
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to remove invite' });
  }
});

router.post('/shared-projects', async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Project name is required', code: 'VALIDATION_ERROR' }); return; }
  try {
    const result = await addSharedProject(req.userId!, name.trim(), description || '');
    res.status(201).json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add project' });
  }
});

router.delete('/shared-projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteSharedProject(req.userId!, projectId);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete project' });
  }
});

router.post('/activity', async (req: AuthRequest, res: Response) => {
  const { action } = req.body as { action?: string };
  if (!action?.trim()) { res.status(400).json({ error: 'Action is required' }); return; }
  try {
    const result = await addActivity(req.userId!, action.trim());
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to add activity' });
  }
});

router.post('/weekly-report', async (req: AuthRequest, res: Response) => {
  try {
    const result = await generateTeamWeeklyReport(req.userId!);
    res.json(result);
  } catch (err) {
    if (handlePlanError(err, res)) return;
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate report' });
  }
});

export default router;
