import type { Task, FocusSession, BrainDump, AnalyticsSummary } from '@/types/index';

export interface WorkspaceContext {
  activeTasks: Array<{ title: string; priority: string }>;
  completedToday: number;
  totalFocusMinutes: number;
  completedSessions: number;
  recentNotes: string[];
}

export function buildWorkspaceContext(params: {
  tasks?: Task[];
  sessions?: FocusSession[];
  brainDumps?: BrainDump[];
  analytics?: AnalyticsSummary | null;
}): WorkspaceContext {
  const { tasks = [], sessions = [], brainDumps = [], analytics = null } = params;

  const activeTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .map(t => ({ title: t.title, priority: t.priority }));

  const today = new Date().toDateString();
  const completedToday = tasks.filter(
    t => t.completed && new Date(t.updatedAt).toDateString() === today
  ).length;

  const completedSessions = analytics?.completedSessions
    ?? sessions.filter(s => s.completed).length;

  const totalFocusMinutes = analytics?.totalFocusMinutes
    ?? sessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0);

  const recentNotes = brainDumps
    .slice(0, 3)
    .map(d => d.content.trim())
    .filter(Boolean);

  return { activeTasks, completedToday, totalFocusMinutes, completedSessions, recentNotes };
}
