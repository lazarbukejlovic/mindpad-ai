import { Router, Response } from 'express';
import { organizeBrainDump } from '../controllers/brainDumpController';
import {
  generateMorningBrief,
  generateEveningSummary,
  askMindPadAI,
  getFocusRecommendation,
  analyzeTaskList,
} from '../services/aiService';
import { AuthRequest } from '../middleware/auth';
import { PlanError } from '../config/plans';

const router = Router();

// /status is registered directly on the app in server.ts (public, no auth).
// All routes here are protected by authMiddleware applied in server.ts.

router.post('/organize', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { content } = req.body;
    if (!content) { res.status(400).json({ error: 'Content is required' }); return; }
    const result = await organizeBrainDump(req.userId, content);
    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof PlanError) {
      res.status(403).json({ error: error.message, code: error.code, requiredPlan: error.requiredPlan });
      return;
    }
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to organize brain dump' });
  }
});

router.post('/morning-brief', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    // Accept either legacy string context or new WorkspaceContext object
    const context = req.body.workspaceContext || req.body.context || '';
    const brief = await generateMorningBrief(context);
    res.status(200).json(brief);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate morning brief' });
  }
});

router.post('/evening-summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { accomplishments, workspaceContext } = req.body;
    const summary = await generateEveningSummary(accomplishments || [], workspaceContext);
    res.status(200).json(summary);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate evening summary' });
  }
});

router.post('/ask', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { question, workspaceContext } = req.body;
    if (!question?.trim()) { res.status(400).json({ error: 'Question is required' }); return; }
    const context = workspaceContext || { activeTasks: [], completedToday: 0, totalFocusMinutes: 0, completedSessions: 0, recentNotes: [] };
    const result = await askMindPadAI(question, context);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to process question' });
  }
});

router.post('/focus-recommendation', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const context = req.body.workspaceContext || { activeTasks: [], completedToday: 0, totalFocusMinutes: 0, completedSessions: 0, recentNotes: [] };
    const recommendation = await getFocusRecommendation(context);
    res.status(200).json(recommendation);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate focus recommendation' });
  }
});

router.post('/task-cleanup', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) { res.status(400).json({ error: 'Tasks array is required' }); return; }
    const result = await analyzeTaskList(tasks);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to analyze tasks' });
  }
});

export default router;
