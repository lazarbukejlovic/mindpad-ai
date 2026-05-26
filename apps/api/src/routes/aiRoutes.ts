import { Router, Response } from 'express';
import { organizeBrainDump } from '../controllers/brainDumpController';
import {
  generateMorningBrief,
  generateEveningSummary,
  askMindPadAI,
  getFocusRecommendation,
  analyzeTaskList,
  getNextBestAction,
  getPriorityBrief,
  analyzeBlockers,
} from '../services/aiService';
import { buildRichContext, buildContextPrompt } from '../services/aiContextService';
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
    const ctx = await buildRichContext(req.userId);
    const contextPrompt = buildContextPrompt(ctx);
    const brief = await generateMorningBrief(contextPrompt);
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
    // Build DB context and merge with any client-provided context as fallback
    const ctx = await buildRichContext(req.userId);
    const richContext = {
      activeTasks: ctx.activeTasks.map(t => ({ title: t.title, priority: t.priority })),
      completedToday: ctx.completedToday,
      totalFocusMinutes: ctx.totalFocusMinutes,
      completedSessions: ctx.recentFocusSessions.filter(s => s.completed).length,
      recentNotes: ctx.recentBrainDumps.map(b => b.content),
    };
    const result = await askMindPadAI(question, richContext);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to process question' });
  }
});

router.post('/focus-recommendation', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const ctx = await buildRichContext(req.userId);
    const richContext = {
      activeTasks: ctx.activeTasks.map(t => ({ title: t.title, priority: t.priority })),
      completedToday: ctx.completedToday,
      totalFocusMinutes: ctx.totalFocusMinutes,
      completedSessions: ctx.recentFocusSessions.filter(s => s.completed).length,
      recentNotes: ctx.recentBrainDumps.map(b => b.content),
    };
    const recommendation = await getFocusRecommendation(richContext);
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

router.post('/next-best-action', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const ctx = await buildRichContext(req.userId);
    const contextPrompt = buildContextPrompt(ctx);
    const result = await getNextBestAction(contextPrompt, ctx.activeTasks);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate next best action' });
  }
});

router.post('/priority-brief', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const ctx = await buildRichContext(req.userId);
    const contextPrompt = buildContextPrompt(ctx);
    const result = await getPriorityBrief(contextPrompt, ctx.activeTasks);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate priority brief' });
  }
});

router.post('/blocker-analysis', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const ctx = await buildRichContext(req.userId);
    const contextPrompt = buildContextPrompt(ctx);
    const result = await analyzeBlockers(contextPrompt);
    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to analyze blockers' });
  }
});

export default router;
