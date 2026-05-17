import { Router, Response } from 'express';
import { organizeBrainDump } from '../controllers/brainDumpController';
import {
  generateMorningBrief,
  generateEveningSummary,
} from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/organize', async (req: AuthRequest, res: Response) => {
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

    const result = await organizeBrainDump(req.userId, content);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to organize brain dump';
    res.status(400).json({ error: message });
  }
});

router.post('/morning-brief', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { context } = req.body;
    const brief = await generateMorningBrief(context || '');

    res.status(200).json(brief);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate morning brief';
    res.status(400).json({ error: message });
  }
});

router.post('/evening-summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { accomplishments } = req.body;
    const summary = await generateEveningSummary(accomplishments || []);

    res.status(200).json(summary);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate evening summary';
    res.status(400).json({ error: message });
  }
});

export default router;
