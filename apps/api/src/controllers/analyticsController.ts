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
    const totalFocusMinutes = focusSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration, 0);
    const averageSessionLength =
      completedSessions > 0 ? Math.round(totalFocusMinutes / completedSessions) : 0;

    const now = new Date();
    let weeklyStreak = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStr = day.toISOString().slice(0, 10);
      const hasActivity = tasks.some(
        (t) => t.completed && (t.updatedAt as Date).toISOString().slice(0, 10) === dayStr
      );
      if (hasActivity) weeklyStreak++;
      else if (i > 0) break;
    }

    return {
      completedTasks,
      totalTasks: tasks.length,
      completedSessions,
      totalFocusMinutes,
      brainDumpsOrganized: brainDumps.filter((bd) => bd.organized).length,
      weeklyStreak,
      averageSessionLength,
    };
  } else {
    return memoryStore.getAnalyticsSummary(userId);
  }
}
