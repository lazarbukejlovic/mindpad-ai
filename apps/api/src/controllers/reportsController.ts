import { User } from '../models/User';
import { Task } from '../models/Task';
import { BrainDump } from '../models/BrainDump';
import { FocusSession } from '../models/FocusSession';
import { PLAN_CONFIG, Plan, PlanError } from '../config/plans';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

const AI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callAI(prompt: string): Promise<string | null> {
  if (!config.geminiApiKey) return null;
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  for (const modelName of AI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch {
      // try next model
    }
  }
  return null;
}

async function requirePlan(userId: string, flag: 'canExportReports' | 'canUseWeeklyReview') {
  const user = await User.findById(userId);
  const plan = (user?.plan as Plan) || 'free';
  if (!PLAN_CONFIG[plan][flag]) {
    throw new PlanError(
      `This feature requires a Pro or Team plan`,
      'UPGRADE_REQUIRED',
      'pro'
    );
  }
  return plan;
}

export async function exportSummary(userId: string): Promise<{ markdown: string }> {
  await requirePlan(userId, 'canExportReports');

  const [tasks, brainDumps, focusSessions] = await Promise.all([
    Task.find({ userId }).sort({ createdAt: -1 }).limit(100),
    BrainDump.find({ userId }).sort({ createdAt: -1 }).limit(20),
    FocusSession.find({ userId }).sort({ createdAt: -1 }).limit(50),
  ]);

  const completedTasks = tasks.filter(t => t.completed);
  const activeTasks = tasks.filter(t => !t.completed);
  const totalFocusMinutes = focusSessions.filter(s => s.completed).reduce((sum, s) => sum + (s.duration || 0), 0);
  const organizedDumps = brainDumps.filter(d => d.organized);

  const contextStr = `
Tasks: ${tasks.length} total, ${completedTasks.length} completed, ${activeTasks.length} active
Focus sessions: ${focusSessions.filter(s => s.completed).length} completed, ${totalFocusMinutes} total minutes
Brain dumps: ${brainDumps.length} total, ${organizedDumps.length} organized

Active tasks (top 10):
${activeTasks.slice(0, 10).map(t => `- [${t.priority}] ${t.title}`).join('\n') || '(none)'}

Recently completed (top 10):
${completedTasks.slice(0, 10).map(t => `- ${t.title}`).join('\n') || '(none)'}
  `.trim();

  const prompt = `You are MindPad AI. Generate a clean Markdown productivity summary for a user's workspace.

Workspace data:
${contextStr}

Generate a Markdown document with these sections:
# Productivity Summary
## Overview
## Completed Work
## Active Priorities
## Focus & Deep Work
## Key Takeaways

Be specific, concise, and execution-focused. Use bullet points. No fluff.`;

  const aiText = await callAI(prompt);

  if (aiText) {
    return { markdown: aiText.trim() };
  }

  // Fallback markdown
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const markdown = `# Productivity Summary
*Generated ${now}*

## Overview
- **${tasks.length}** total tasks tracked
- **${completedTasks.length}** tasks completed
- **${activeTasks.length}** tasks active
- **${(totalFocusMinutes / 60).toFixed(1)}** hours of focused work
- **${brainDumps.length}** brain dumps captured

## Completed Work
${completedTasks.slice(0, 10).map(t => `- ${t.title}`).join('\n') || '- No completed tasks yet'}

## Active Priorities
${activeTasks.slice(0, 10).map(t => `- [${t.priority.toUpperCase()}] ${t.title}`).join('\n') || '- No active tasks'}

## Focus & Deep Work
- ${focusSessions.filter(s => s.completed).length} focus sessions completed
- ${totalFocusMinutes} total focus minutes
- ${organizedDumps.length} brain dumps organized with AI

## Key Takeaways
- Completion rate: ${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
- Keep your active task list focused on high-priority items
- Regular brain dumps help maintain clarity and reduce mental load
`;

  return { markdown };
}

export async function weeklyReview(userId: string): Promise<{
  completedWork: string[];
  unfinishedPriorities: string[];
  focusConsistency: string;
  executionScore: number;
  suggestedNextSteps: string[];
  summary: string;
}> {
  await requirePlan(userId, 'canUseWeeklyReview');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [tasks, focusSessions, brainDumps] = await Promise.all([
    Task.find({ userId }).sort({ createdAt: -1 }).limit(200),
    FocusSession.find({ userId, createdAt: { $gte: oneWeekAgo } }),
    BrainDump.find({ userId, createdAt: { $gte: oneWeekAgo } }),
  ]);

  const completedThisWeek = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo);
  const activeTasks = tasks.filter(t => !t.completed);
  const highPriorityActive = activeTasks.filter(t => t.priority === 'high');
  const completedSessions = focusSessions.filter(s => s.completed);
  const totalFocusMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const completionRate = tasks.length > 0 ? (completedThisWeek.length / Math.max(tasks.length * 0.3, 1)) * 100 : 0;
  const focusScore = Math.min(totalFocusMinutes / 120, 1) * 100;
  const brainDumpScore = Math.min(brainDumps.length / 3, 1) * 100;
  const executionScore = Math.round((completionRate * 0.5 + focusScore * 0.3 + brainDumpScore * 0.2));

  const contextStr = `
This week:
- Completed tasks: ${completedThisWeek.map(t => t.title).join(', ') || 'none'}
- Active (unfinished) tasks: ${activeTasks.slice(0, 8).map(t => `[${t.priority}] ${t.title}`).join(', ') || 'none'}
- Focus sessions: ${completedSessions.length}, total minutes: ${totalFocusMinutes}
- Brain dumps: ${brainDumps.length}
- High priority unfinished: ${highPriorityActive.map(t => t.title).join(', ') || 'none'}
  `.trim();

  const prompt = `You are MindPad AI. Generate a structured weekly execution review.

User data:
${contextStr}

Respond with a JSON object:
{
  "completedWork": ["specific accomplishment 1", "specific accomplishment 2"],
  "unfinishedPriorities": ["unfinished item 1", "unfinished item 2"],
  "focusConsistency": "1-2 sentences about focus session patterns",
  "suggestedNextSteps": ["actionable next step 1", "actionable next step 2", "actionable next step 3"],
  "summary": "2-3 sentence executive summary of the week"
}

Be specific to the user's actual data. Return ONLY valid JSON.`;

  const aiText = await callAI(prompt);

  if (aiText) {
    try {
      const cleaned = aiText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          completedWork: Array.isArray(parsed.completedWork) ? parsed.completedWork : [],
          unfinishedPriorities: Array.isArray(parsed.unfinishedPriorities) ? parsed.unfinishedPriorities : [],
          focusConsistency: parsed.focusConsistency || '',
          executionScore,
          suggestedNextSteps: Array.isArray(parsed.suggestedNextSteps) ? parsed.suggestedNextSteps : [],
          summary: parsed.summary || '',
        };
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback
  return {
    completedWork: completedThisWeek.slice(0, 5).map(t => t.title),
    unfinishedPriorities: highPriorityActive.slice(0, 3).map(t => t.title),
    focusConsistency: completedSessions.length > 0
      ? `${completedSessions.length} sessions completed this week (${totalFocusMinutes} minutes total).`
      : 'No focus sessions recorded this week. Consider scheduling regular deep work blocks.',
    executionScore,
    suggestedNextSteps: [
      highPriorityActive[0] ? `Focus on: ${highPriorityActive[0].title}` : 'Create your top priority task',
      'Schedule a 25-minute deep work session',
      'Run a brain dump to capture outstanding thoughts',
    ],
    summary: completedThisWeek.length > 0
      ? `You completed ${completedThisWeek.length} task${completedThisWeek.length !== 1 ? 's' : ''} this week with ${totalFocusMinutes} minutes of focused work. ${activeTasks.length} tasks remain active.`
      : `No tasks completed this week. You have ${activeTasks.length} active tasks. Focus on your highest-priority items first.`,
  };
}
