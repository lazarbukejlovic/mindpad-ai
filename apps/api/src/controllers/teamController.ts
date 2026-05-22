import { User } from '../models/User';
import { Task } from '../models/Task';
import { TeamWorkspace } from '../models/TeamWorkspace';
import { PLAN_CONFIG, Plan, PlanError } from '../config/plans';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { randomUUID } from 'crypto';

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
      // try next
    }
  }
  return null;
}

async function requireTeamPlan(userId: string) {
  const user = await User.findById(userId);
  const plan = (user?.plan as Plan) || 'free';
  if (plan !== 'team') {
    throw new PlanError('Team workspace requires a Team plan', 'TEAM_PLAN_REQUIRED', 'team');
  }
  return user!;
}

function serializeWorkspace(workspace: InstanceType<typeof TeamWorkspace>) {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    invitedEmails: workspace.invitedEmails,
    memberIds: workspace.memberIds,
    memberCount: workspace.memberIds.length + workspace.invitedEmails.length + 1,
    sharedProjects: workspace.sharedProjects || [],
    activityFeed: (workspace.activityFeed || []).slice(-50).reverse(),
    createdAt: workspace.createdAt,
  };
}

export async function getTeamWorkspace(userId: string) {
  const user = await User.findById(userId);
  const plan = (user?.plan as Plan) || 'free';

  if (plan !== 'team') {
    return {
      exists: false,
      plan,
      entitlements: PLAN_CONFIG[plan],
      upgradeRequired: true,
    };
  }

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) {
    return {
      exists: false,
      plan,
      entitlements: PLAN_CONFIG['team'],
      upgradeRequired: false,
    };
  }

  return {
    exists: true,
    plan,
    entitlements: PLAN_CONFIG['team'],
    upgradeRequired: false,
    workspace: serializeWorkspace(workspace),
  };
}

export async function createTeamWorkspace(userId: string, name: string) {
  await requireTeamPlan(userId);

  const existing = await TeamWorkspace.findOne({ ownerId: userId });
  if (existing) throw new Error('Team workspace already exists');

  const workspace = new TeamWorkspace({
    ownerId: userId,
    name,
    invitedEmails: [],
    memberIds: [],
    sharedProjects: [],
    activityFeed: [{
      id: randomUUID(),
      action: `Workspace "${name}" created`,
      actor: userId,
      timestamp: new Date(),
    }],
  });
  await workspace.save();

  return serializeWorkspace(workspace);
}

export async function updateTeamWorkspace(userId: string, updates: { name?: string }) {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  if (updates.name) {
    workspace.activityFeed.push({
      id: randomUUID(),
      action: `Workspace renamed to "${updates.name}"`,
      actor: userId,
      timestamp: new Date(),
    });
    workspace.name = updates.name;
  }
  await workspace.save();

  return serializeWorkspace(workspace);
}

export async function inviteTeamMember(userId: string, email: string) {
  const user = await requireTeamPlan(userId);
  const plan = (user.plan as Plan) || 'team';
  const { maxTeamMembers } = PLAN_CONFIG[plan];

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found. Create one first.');

  const totalSlots = workspace.memberIds.length + workspace.invitedEmails.length + 1;
  if (totalSlots >= maxTeamMembers) {
    throw new PlanError(`Team member limit reached (${maxTeamMembers})`, 'PLAN_LIMIT_REACHED');
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (workspace.invitedEmails.includes(normalizedEmail)) {
    throw new Error('This email has already been invited');
  }

  workspace.invitedEmails.push(normalizedEmail);
  workspace.activityFeed.push({
    id: randomUUID(),
    action: `Invited ${normalizedEmail}`,
    actor: userId,
    timestamp: new Date(),
  });
  await workspace.save();

  return { invitedEmails: workspace.invitedEmails };
}

export async function removeInvite(userId: string, email: string) {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  const normalizedEmail = email.toLowerCase().trim();
  workspace.invitedEmails = workspace.invitedEmails.filter((e: string) => e !== normalizedEmail);
  workspace.activityFeed.push({
    id: randomUUID(),
    action: `Removed invite for ${normalizedEmail}`,
    actor: userId,
    timestamp: new Date(),
  });
  await workspace.save();

  return { invitedEmails: workspace.invitedEmails };
}

export async function addSharedProject(userId: string, name: string, description: string) {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found. Create one first.');

  const project = {
    id: randomUUID(),
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: new Date(),
  };

  workspace.sharedProjects.push(project);
  workspace.activityFeed.push({
    id: randomUUID(),
    action: `Created shared project "${name}"`,
    actor: userId,
    timestamp: new Date(),
  });
  await workspace.save();

  return { sharedProjects: workspace.sharedProjects };
}

export async function deleteSharedProject(userId: string, projectId: string) {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  const project = workspace.sharedProjects.find((p: { id: string }) => p.id === projectId);
  workspace.sharedProjects = workspace.sharedProjects.filter((p: { id: string }) => p.id !== projectId);
  if (project) {
    workspace.activityFeed.push({
      id: randomUUID(),
      action: `Deleted project "${project.name}"`,
      actor: userId,
      timestamp: new Date(),
    });
  }
  await workspace.save();

  return { sharedProjects: workspace.sharedProjects };
}

export async function addActivity(userId: string, action: string) {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  workspace.activityFeed.push({
    id: randomUUID(),
    action: action.trim(),
    actor: userId,
    timestamp: new Date(),
  });
  // Keep feed at max 200 entries
  if (workspace.activityFeed.length > 200) {
    workspace.activityFeed = workspace.activityFeed.slice(-200);
  }
  await workspace.save();

  return { activityFeed: workspace.activityFeed.slice(-50).reverse() };
}

export async function generateTeamWeeklyReport(userId: string): Promise<{
  activitySummary: string;
  sharedPriorities: string[];
  executionRisks: string[];
  suggestedNextActions: string[];
  memberCount: number;
  projectCount: number;
}> {
  await requireTeamPlan(userId);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = (workspace.activityFeed || [])
    .filter((a: { timestamp: Date }) => new Date(a.timestamp) >= oneWeekAgo)
    .slice(-20);

  const activeTasks = await Task.find({ userId }).limit(50);
  const highPriorityTasks = activeTasks.filter(t => !t.completed && t.priority === 'high');

  const memberCount = workspace.memberIds.length + workspace.invitedEmails.length + 1;
  const projectCount = workspace.sharedProjects.length;

  const contextStr = `
Team workspace: ${workspace.name}
Members: ${memberCount} (${workspace.invitedEmails.length} invited)
Shared projects: ${projectCount} — ${workspace.sharedProjects.map((p: { name: string }) => p.name).join(', ') || 'none'}
Recent activity (last 7 days): ${recentActivity.map((a: { action: string }) => a.action).join('; ') || 'none'}
Active high-priority tasks: ${highPriorityTasks.map(t => t.title).slice(0, 5).join(', ') || 'none'}
  `.trim();

  const prompt = `You are MindPad AI. Generate a team weekly execution report.

Team context:
${contextStr}

Respond with a JSON object:
{
  "activitySummary": "2-3 sentences summarizing team activity this week",
  "sharedPriorities": ["top priority 1", "top priority 2", "top priority 3"],
  "executionRisks": ["risk 1", "risk 2"],
  "suggestedNextActions": ["action 1", "action 2", "action 3"]
}

Be specific and actionable. Return ONLY valid JSON.`;

  const aiText = await callAI(prompt);

  if (aiText) {
    try {
      const cleaned = aiText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          activitySummary: parsed.activitySummary || '',
          sharedPriorities: Array.isArray(parsed.sharedPriorities) ? parsed.sharedPriorities : [],
          executionRisks: Array.isArray(parsed.executionRisks) ? parsed.executionRisks : [],
          suggestedNextActions: Array.isArray(parsed.suggestedNextActions) ? parsed.suggestedNextActions : [],
          memberCount,
          projectCount,
        };
      }
    } catch {
      // fall through
    }
  }

  return {
    activitySummary: recentActivity.length > 0
      ? `${recentActivity.length} activities recorded this week across the team workspace.`
      : 'No recent team activity recorded this week. Encourage team members to update shared projects.',
    sharedPriorities: highPriorityTasks.slice(0, 3).map(t => t.title),
    executionRisks: [
      highPriorityTasks.length > 5 ? 'Multiple high-priority items may dilute focus' : '',
      memberCount <= 1 ? 'Team has no active members yet — invite collaborators' : '',
    ].filter(Boolean),
    suggestedNextActions: [
      projectCount === 0 ? 'Create your first shared project' : `Review progress on "${workspace.sharedProjects[0]?.name}"`,
      highPriorityTasks[0] ? `Address: ${highPriorityTasks[0].title}` : 'Add high-priority tasks to the workspace',
      'Schedule a team sync to align on priorities',
    ],
    memberCount,
    projectCount,
  };
}
