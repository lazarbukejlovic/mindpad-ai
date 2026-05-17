import { Router, Response } from 'express';
import {
  createBrainDump,
  getBrainDumps,
  organizeBrainDump,
} from '../controllers/brainDumpController';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const brainDump = await createBrainDump(req.userId, content);
    res.status(201).json(brainDump);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create brain dump';
    res.status(400).json({ error: message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const brainDumps = await getBrainDumps(req.userId);
    res.status(200).json(brainDumps);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get brain dumps';
    res.status(400).json({ error: message });
  }
});

export default router;
