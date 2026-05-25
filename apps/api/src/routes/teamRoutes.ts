import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlanError } from '../config/plans';
import { TeamRole } from '../models/TeamInvite';
import {
  getTeamWorkspace,
  createTeamWorkspace,
  updateTeamWorkspace,
  createInvite,
  revokeInvite,
  regenerateInvite,
  acceptInvite,
  updateMemberRole,
  removeMember,
  addSharedProject,
  deleteSharedProject,
  generateTeamWeeklyReport,
} from '../controllers/teamController';

const router = Router();

function handleError(err: unknown, res: Response) {
  if (err instanceof PlanError) {
    res.status(403).json({ error: err.message, code: err.code, requiredPlan: err.requiredPlan });
    return;
  }
  const msg = err instanceof Error ? err.message : 'An error occurred';
  res.status(400).json({ error: msg });
}

// GET workspace
router.get('/workspace', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await getTeamWorkspace(req.userId!));
  } catch (err) { handleError(err, res); }
});

// Alias: GET / (backward compat)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await getTeamWorkspace(req.userId!));
  } catch (err) { handleError(err, res); }
});

// POST / — create workspace
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Workspace name is required' }); return; }
  try {
    res.status(201).json(await createTeamWorkspace(req.userId!, name.trim()));
  } catch (err) { handleError(err, res); }
});

// PATCH workspace — rename
router.patch('/workspace', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await updateTeamWorkspace(req.userId!, req.body));
  } catch (err) { handleError(err, res); }
});

// Alias: PATCH / (backward compat)
router.patch('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await updateTeamWorkspace(req.userId!, req.body));
  } catch (err) { handleError(err, res); }
});

// POST /invite — create invite, returns inviteUrl (shown once)
router.post('/invite', async (req: AuthRequest, res: Response) => {
  const { email, role } = req.body as { email?: string; role?: TeamRole };
  if (!email?.trim()) { res.status(400).json({ error: 'Email is required' }); return; }
  const safeRole: TeamRole = role === 'admin' ? 'admin' : 'member';
  try {
    res.status(201).json(await createInvite(req.userId!, email.trim(), safeRole));
  } catch (err) { handleError(err, res); }
});

// DELETE /invite/:id — revoke invite
router.delete('/invite/:id', async (req: AuthRequest, res: Response) => {
  const inviteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    res.json(await revokeInvite(req.userId!, inviteId));
  } catch (err) { handleError(err, res); }
});

// POST /invite/:id/regenerate — revoke + issue new invite link for same email
router.post('/invite/:id/regenerate', async (req: AuthRequest, res: Response) => {
  const inviteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    res.json(await regenerateInvite(req.userId!, inviteId));
  } catch (err) { handleError(err, res); }
});

// POST /invite/accept — accept an invite using raw token (authenticated)
router.post('/invite/accept', async (req: AuthRequest, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token?.trim()) { res.status(400).json({ error: 'Token is required' }); return; }
  try {
    res.json(await acceptInvite(token.trim(), req.userId!));
  } catch (err) { handleError(err, res); }
});

// PATCH /members/:userId/role — update member role (owner only)
router.patch('/members/:userId/role', async (req: AuthRequest, res: Response) => {
  const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const { role } = req.body as { role?: TeamRole };
  if (!role) { res.status(400).json({ error: 'Role is required' }); return; }
  try {
    res.json(await updateMemberRole(req.userId!, targetUserId, role));
  } catch (err) { handleError(err, res); }
});

// DELETE /members/:userId — remove member (owner/admin)
router.delete('/members/:userId', async (req: AuthRequest, res: Response) => {
  const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  try {
    res.json(await removeMember(req.userId!, targetUserId));
  } catch (err) { handleError(err, res); }
});

// Shared projects
router.post('/shared-projects', async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Project name is required' }); return; }
  try {
    res.status(201).json(await addSharedProject(req.userId!, name.trim(), description || ''));
  } catch (err) { handleError(err, res); }
});

router.delete('/shared-projects/:id', async (req: AuthRequest, res: Response) => {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    res.json(await deleteSharedProject(req.userId!, projectId));
  } catch (err) { handleError(err, res); }
});

// Team weekly report
router.post('/weekly-report', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await generateTeamWeeklyReport(req.userId!));
  } catch (err) {
    if (err instanceof PlanError) {
      res.status(403).json({ error: err.message, code: err.code, requiredPlan: err.requiredPlan });
      return;
    }
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate report' });
  }
});

export default router;
