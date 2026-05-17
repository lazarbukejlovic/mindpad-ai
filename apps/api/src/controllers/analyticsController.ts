import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';

export async function getAnalyticsSummary(userId: string) {
  if (isMongoConnected()) {
    const { Task } = await import('../models/Task');
    const { FocusSession } = await import('../models/FocusSession');
    const { BrainDump } = await import('../models/BrainDump');

    const tasks = await Task.find({ userId });
    const focusSessions = await FocusSession.find({ userId });
    const brainDumps = await BrainDump.find({ userId });

    const completedTasks = tasks.filter((t) => t.completed).length;
    const completedSessions = focusSessions.filter((s) => s.completed).length;
    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      completedTasks,
      totalTasks: tasks.length,
      completedSessions,
      totalFocusMinutes,
      brainDumpsOrganized: brainDumps.length,
      weeklyStreak: 5, // Mock for now
      averageSessionLength:
        completedSessions > 0
          ? Math.round(totalFocusMinutes / completedSessions)
          : 0,
    };
  } else {
    return memoryStore.getAnalyticsSummary(userId);
  }
}
