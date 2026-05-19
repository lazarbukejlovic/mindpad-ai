import { Router, Response } from 'express';
import {
  createFocusSession,
  completeFocusSession,
  deleteFocusSession,
  getFocusSessions,
} from '../controllers/focusController';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await createFocusSession(req.userId, req.body);
    res.status(201).json(session);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create focus session';
    res.status(400).json({ error: message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessions = await getFocusSessions(req.userId);
    res.status(200).json(sessions);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get focus sessions';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await completeFocusSession(req.userId, sessionId);
    res.status(200).json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete session';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteFocusSession(req.userId, sessionId);
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete session';
    res.status(400).json({ error: message });
  }
});

export default router;
