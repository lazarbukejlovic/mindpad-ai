import { Router, Response } from 'express';
import {
  createFocusSession,
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

export default router;
