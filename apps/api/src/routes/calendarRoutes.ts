import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import {
  getCalendarStatus,
  buildCalendarOAuthUrl,
  disconnectCalendar,
  createFocusBlock,
  FocusBlockInput,
} from '../controllers/calendarController';
import { logger } from '../utils/logger';

const router = Router();

const ALLOWED_DURATIONS = new Set([25, 50, 90]);

// GET /api/calendar/status  (protected)
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = await getCalendarStatus(req.userId!);
    res.json(status);
  } catch {
    res.json({ connected: false, googleEmail: null, requiresReconnect: false });
  }
});

// GET /api/calendar/google/start  (protected)
router.get('/google/start', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.googleClientId || !config.googleClientSecret) {
      res.status(503).json({ error: 'Calendar integration is not available.' });
      return;
    }
    const url = buildCalendarOAuthUrl(req.userId!);
    res.json({ url });
  } catch (err) {
    logger.warn('Calendar start error', { message: err instanceof Error ? err.message : 'unknown' });
    res.status(500).json({ error: 'Could not start calendar connection. Try again.' });
  }
});

// POST /api/calendar/disconnect  (protected)
router.post('/disconnect', async (req: AuthRequest, res: Response) => {
  try {
    await disconnectCalendar(req.userId!);
    res.json({ message: 'Calendar disconnected.' });
  } catch {
    res.status(500).json({ error: 'Could not disconnect calendar. Try again.' });
  }
});

// POST /api/calendar/focus-block  (protected)
router.post('/focus-block', async (req: AuthRequest, res: Response) => {
  const { title, taskId, startDateTime, durationMinutes, notes, timezone } = req.body as Partial<FocusBlockInput & { taskId?: string }>;

  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required.' });
    return;
  }
  if (!startDateTime || isNaN(Date.parse(startDateTime))) {
    res.status(400).json({ error: 'A valid start date and time is required.' });
    return;
  }
  if (!durationMinutes || !ALLOWED_DURATIONS.has(durationMinutes)) {
    res.status(400).json({ error: 'Duration must be 25, 50, or 90 minutes.' });
    return;
  }

  try {
    const result = await createFocusBlock(req.userId!, {
      title: title.trim(),
      taskId,
      startDateTime,
      durationMinutes,
      notes,
      timezone,
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'plan_required') {
      res.status(403).json({ error: 'Calendar scheduling is available on Pro and Team plans.', code: 'PLAN_REQUIRED' });
      return;
    }
    if (msg === 'not_connected') {
      res.status(400).json({ error: 'Please connect Google Calendar first.', code: 'NOT_CONNECTED' });
      return;
    }
    if (msg === 'reconnect_required') {
      res.status(400).json({ error: 'Please reconnect Google Calendar.', code: 'RECONNECT_REQUIRED' });
      return;
    }
    logger.error('Focus block creation error', { message: msg, userId: req.userId });
    res.status(500).json({ error: 'Could not schedule this focus block. Try again.' });
  }
});

export default router;
