import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { BrainDump } from '../models/BrainDump';
import { FocusSession } from '../models/FocusSession';
import { isMongoConnected } from '../config/database';

async function detectExistingData(userId: string): Promise<boolean> {
  if (!isMongoConnected()) return false;
  const [taskCount, dumpCount, sessionCount] = await Promise.all([
    Task.countDocuments({ userId }),
    BrainDump.countDocuments({ userId }),
    FocusSession.countDocuments({ userId }),
  ]);
  return taskCount > 0 || dumpCount > 0 || sessionCount > 0;
}

export async function getOnboardingStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const user = await User.findById(req.userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const hasExistingData = await detectExistingData(req.userId);

  let recommendedNextStep = 'goal';
  if (user.onboardingGoal && !user.firstBrainDumpCompleted) recommendedNextStep = 'brain-dump';
  else if (user.firstBrainDumpCompleted && !user.firstTasksExtracted) recommendedNextStep = 'extraction';
  else if (user.firstTasksExtracted && !user.firstFocusStarted) recommendedNextStep = 'focus';
  else if (user.firstFocusStarted) recommendedNextStep = 'complete';

  res.json({
    onboardingCompleted: user.onboardingCompleted ?? false,
    onboardingGoal: user.onboardingGoal ?? null,
    firstBrainDumpCompleted: user.firstBrainDumpCompleted ?? false,
    firstTasksExtracted: user.firstTasksExtracted ?? false,
    firstFocusStarted: user.firstFocusStarted ?? false,
    recommendedNextStep,
    hasExistingData,
  });
}

const ALLOWED_UPDATE_FIELDS = [
  'onboardingGoal',
  'onboardingStep',
  'firstBrainDumpCompleted',
  'firstTasksExtracted',
  'firstFocusStarted',
] as const;

export async function updateOnboardingStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in req.body) update[key] = req.body[key];
  }

  await User.findByIdAndUpdate(req.userId, { $set: update });
  res.json({ ok: true });
}

export async function completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  await User.findByIdAndUpdate(req.userId, {
    $set: { onboardingCompleted: true, onboardingCompletedAt: new Date() },
  });
  res.json({ ok: true });
}

export async function restartOnboarding(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  await User.findByIdAndUpdate(req.userId, {
    $set: {
      onboardingCompleted: false,
      firstBrainDumpCompleted: false,
      firstTasksExtracted: false,
      firstFocusStarted: false,
    },
    $unset: { onboardingGoal: '', onboardingStep: '', onboardingCompletedAt: '' },
  });
  res.json({ ok: true });
}
