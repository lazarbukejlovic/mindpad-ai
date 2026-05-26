import { Task } from '../models/Task';
import { FocusSession } from '../models/FocusSession';
import { BrainDump } from '../models/BrainDump';
import { User } from '../models/User';
import { TeamWorkspace } from '../models/TeamWorkspace';
import { PLAN_CONFIG, Plan } from '../config/plans';

const URGENT_RE = /\b(urgent|asap|today|deadline|critical|fix|emergency|launch|ship)\b/i;
const BLOCKER_RE = /\b(blocked|stuck|waiting|depends|delayed|paused|blocking)\b/i;
const IMPACT_RE = /\b(client|customer|revenue|production|demo|meeting|investor)\b/i;

export interface ScoredTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  score: number;
  ageDays: number;
  isStale: boolean;
  mentionCount: number;
}

export interface RichUserContext {
  userId: string;
  plan: Plan;
  onboardingGoal?: string;
  activeTasks: ScoredTask[];
  recentlyCompleted: Array<{ title: string; completedAt: Date }>;
  recentBrainDumps: Array<{ content: string; summary?: string; createdAt: Date }>;
  recentFocusSessions: Array<{ duration: number; completed: boolean; startedAt: Date }>;
  totalFocusMinutes: number;
  completedToday: number;
  teamContext?: {
    workspaceName: string;
    memberCount: number;
    recentActivity: string[];
  };
}

function scoreTask(
  task: { title: string; priority: string; createdAt: Date },
  brainDumpContents: string[]
): { score: number; ageDays: number; isStale: boolean; mentionCount: number } {
  let score = 0;

  if (task.priority === 'high') score += 3;
  else if (task.priority === 'medium') score += 1;

  if (URGENT_RE.test(task.title)) score += 3;
  if (IMPACT_RE.test(task.title)) score += 2;
  if (BLOCKER_RE.test(task.title)) score += 2;

  const ageDays = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86_400_000);
  if (ageDays > 14) score += 2;
  else if (ageDays > 7) score += 1;

  const titleWords = task.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let mentionCount = 0;
  for (const dump of brainDumpContents) {
    if (titleWords.some(w => dump.toLowerCase().includes(w))) mentionCount++;
  }
  score += Math.min(mentionCount, 3);

  return { score, ageDays, isStale: ageDays > 14, mentionCount };
}

export async function buildRichContext(userId: string): Promise<RichUserContext> {
  const [user, tasks, focusSessions, brainDumps, teamWorkspace] = await Promise.all([
    User.findById(userId).lean(),
    Task.find({ userId }).sort({ createdAt: -1 }).lean(),
    FocusSession.find({ userId }).sort({ startedAt: -1 }).limit(10).lean(),
    BrainDump.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    TeamWorkspace.findOne({ $or: [{ ownerId: userId }, { 'members.userId': userId }] }).lean(),
  ]);

  if (!user) throw new Error('User not found');

  const plan = ((user as any).plan as Plan) || 'free';

  const allTasks = tasks as any[];
  const allFocus = focusSessions as any[];
  const allDumps = brainDumps as any[];

  const activeTasks = allTasks.filter(t => !t.completed);
  const brainDumpContents = allDumps.map((b: any) => b.content || '');

  const scoredTasks: ScoredTask[] = activeTasks
    .map(t => {
      const { score, ageDays, isStale, mentionCount } = scoreTask(t, brainDumpContents);
      return { title: t.title, priority: t.priority as 'low' | 'medium' | 'high', score, ageDays, isStale, mentionCount };
    })
    .sort((a, b) => b.score - a.score);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = allTasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= today).length;

  const totalFocusMinutes = allFocus
    .filter((s: any) => s.completed)
    .reduce((sum: number, s: any) => sum + (s.duration || 0), 0);

  const recentlyCompleted = allTasks
    .filter(t => t.completed && t.completedAt)
    .slice(0, 10)
    .map(t => ({ title: t.title, completedAt: t.completedAt }));

  const recentBrainDumps = allDumps.map((b: any) => ({
    content: (b.content || '').slice(0, 400),
    summary: b.summary,
    createdAt: b.createdAt,
  }));

  const recentFocusSessions = allFocus.map((s: any) => ({
    duration: s.duration,
    completed: s.completed,
    startedAt: s.startedAt,
  }));

  let teamContext: RichUserContext['teamContext'];
  if (teamWorkspace) {
    const ws = teamWorkspace as any;
    const memberCount = (ws.members?.length || 0) + 1;
    const recentActivity = (ws.activityFeed || [])
      .slice(0, 5)
      .map((a: any) => `${a.actorName || 'A member'} ${a.action}`);
    teamContext = { workspaceName: ws.name, memberCount, recentActivity };
  }

  return {
    userId,
    plan,
    onboardingGoal: (user as any).onboardingGoal,
    activeTasks: scoredTasks,
    recentlyCompleted,
    recentBrainDumps,
    recentFocusSessions,
    totalFocusMinutes,
    completedToday,
    teamContext,
  };
}

export function buildContextPrompt(ctx: RichUserContext): string {
  const lines: string[] = [];

  lines.push(`Plan: ${ctx.plan}`);
  if (ctx.onboardingGoal) lines.push(`User goal: ${ctx.onboardingGoal}`);

  lines.push(`\nActive tasks (${ctx.activeTasks.length}), ranked by priority + urgency signals:`);
  if (ctx.activeTasks.length === 0) {
    lines.push('  (none)');
  } else {
    ctx.activeTasks.slice(0, 12).forEach(t => {
      const flags: string[] = [];
      if (t.isStale) flags.push(`stale >${t.ageDays}d`);
      if (t.mentionCount > 0) flags.push(`mentioned ${t.mentionCount}x in notes`);
      lines.push(`  [${t.priority}] ${t.title}${flags.length ? ' (' + flags.join(', ') + ')' : ''}`);
    });
  }

  if (ctx.recentlyCompleted.length > 0) {
    lines.push(`\nRecently completed (${ctx.recentlyCompleted.length}):`);
    ctx.recentlyCompleted.slice(0, 5).forEach(t => lines.push(`  - ${t.title}`));
  }

  lines.push(`\nFocus sessions: ${ctx.recentFocusSessions.length} recent, ${ctx.totalFocusMinutes} total completed minutes`);
  lines.push(`Completed today: ${ctx.completedToday}`);

  if (ctx.recentBrainDumps.length > 0) {
    lines.push(`\nRecent brain dumps (${ctx.recentBrainDumps.length}):`);
    ctx.recentBrainDumps.slice(0, 3).forEach((b, i) => {
      const preview = b.content.replace(/\s+/g, ' ').slice(0, 200);
      lines.push(`  [${i + 1}] ${preview}${b.content.length > 200 ? '...' : ''}`);
    });
  }

  if (ctx.teamContext) {
    lines.push(`\nTeam workspace: "${ctx.teamContext.workspaceName}", ${ctx.teamContext.memberCount} members`);
    if (ctx.teamContext.recentActivity.length > 0) {
      lines.push(`  Recent activity: ${ctx.teamContext.recentActivity.slice(0, 3).join('; ')}`);
    }
  }

  return lines.join('\n');
}
