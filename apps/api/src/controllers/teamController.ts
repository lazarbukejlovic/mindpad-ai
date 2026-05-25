import crypto from 'crypto';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { TeamWorkspace, ITeamMember } from '../models/TeamWorkspace';
import { TeamInvite, TeamRole } from '../models/TeamInvite';
import { PLAN_CONFIG, Plan, PlanError } from '../config/plans';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { randomUUID } from 'crypto';
import { sendTeamInviteEmail } from '../services/emailService';

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

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function getUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
}

function getPlan(user: { plan?: string }): Plan {
  return (user.plan as Plan) || 'free';
}

function requireOwnerOrAdmin(workspace: { ownerId: string; members: ITeamMember[] }, userId: string) {
  if (workspace.ownerId === userId) return;
  const member = workspace.members.find(m => m.userId === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new Error('Only workspace owners and admins can perform this action');
  }
}

function requireOwner(workspace: { ownerId: string }, userId: string) {
  if (workspace.ownerId !== userId) {
    throw new Error('Only the workspace owner can perform this action');
  }
}

// Returns the resolved members array, always including the owner,
// migrating legacy memberIds entries if the members array is empty.
function resolvedMembers(workspace: {
  ownerId: string;
  members: ITeamMember[];
  memberIds: string[];
  createdAt: Date;
}): ITeamMember[] {
  const result: ITeamMember[] = [...workspace.members];

  // Ensure owner is present
  if (!result.some(m => m.userId === workspace.ownerId)) {
    result.unshift({ userId: workspace.ownerId, role: 'owner', joinedAt: workspace.createdAt });
  }

  // Migrate legacy memberIds not already in the array
  for (const uid of workspace.memberIds) {
    if (!result.some(m => m.userId === uid)) {
      result.push({ userId: uid, role: 'member', joinedAt: workspace.createdAt });
    }
  }

  return result;
}

async function addActivityEntry(
  workspace: InstanceType<typeof TeamWorkspace>,
  userId: string,
  action: string,
) {
  let actorName: string | undefined;
  try {
    const actor = await User.findById(userId).select('name email').lean();
    actorName = actor?.name || actor?.email || undefined;
  } catch { /* non-critical */ }

  workspace.activityFeed.push({
    id: randomUUID(),
    action,
    actor: userId,
    actorName,
    timestamp: new Date(),
  });

  if (workspace.activityFeed.length > 200) {
    workspace.activityFeed = workspace.activityFeed.slice(-200);
  }
}

async function serializeWorkspace(
  workspace: InstanceType<typeof TeamWorkspace>,
  plan: Plan,
) {
  const allMembers = resolvedMembers(workspace);

  // Enrich members with user profile data
  const userIds = allMembers.map(m => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('name email avatarUrl').lean();
  const userMap: Record<string, { name?: string | null; email?: string; avatarUrl?: string | null }> = {};
  for (const u of users) {
    userMap[String(u._id)] = { name: u.name, email: u.email, avatarUrl: u.avatarUrl };
  }

  const enrichedMembers = allMembers.map(m => ({
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    name: userMap[m.userId]?.name ?? null,
    email: userMap[m.userId]?.email ?? null,
    avatarUrl: userMap[m.userId]?.avatarUrl ?? null,
  }));

  // Pending invites (not expired, not accepted, not revoked)
  const pendingInvites = await TeamInvite.find({
    teamId: workspace._id.toString(),
    acceptedAt: { $exists: false },
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).select('-tokenHash').lean();

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    ownerId: workspace.ownerId,
    members: enrichedMembers,
    pendingInvites: pendingInvites.map(inv => ({
      id: String(inv._id),
      invitedEmail: inv.invitedEmail,
      role: inv.role,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    })),
    memberCount: enrichedMembers.length,
    maxMembers: PLAN_CONFIG[plan]?.maxTeamMembers ?? 1,
    sharedProjects: workspace.sharedProjects || [],
    activityFeed: (workspace.activityFeed || []).slice(-50).reverse(),
    createdAt: workspace.createdAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Public exports
// ──────────────────────────────────────────────────────────────────────────────

export async function getTeamWorkspace(userId: string) {
  const user = await getUser(userId);
  const plan = getPlan(user);
  const entitlements = PLAN_CONFIG[plan];

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) {
    return { exists: false, plan, entitlements, upgradeRequired: false };
  }

  return {
    exists: true,
    plan,
    entitlements,
    upgradeRequired: false,
    workspace: await serializeWorkspace(workspace, plan),
  };
}

export async function createTeamWorkspace(userId: string, name: string) {
  const user = await getUser(userId);
  const plan = getPlan(user);

  const existing = await TeamWorkspace.findOne({ ownerId: userId });
  if (existing) throw new Error('Team workspace already exists');

  const workspace = new TeamWorkspace({
    ownerId: userId,
    name,
    members: [{ userId, role: 'owner', joinedAt: new Date() }],
    invitedEmails: [],
    memberIds: [],
    sharedProjects: [],
    activityFeed: [],
  });

  await addActivityEntry(workspace, userId, `Workspace "${name}" created`);
  await workspace.save();

  return serializeWorkspace(workspace, plan);
}

export async function updateTeamWorkspace(userId: string, updates: { name?: string }) {
  const user = await getUser(userId);
  const plan = getPlan(user);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');
  requireOwnerOrAdmin(workspace, userId);

  if (updates.name?.trim()) {
    await addActivityEntry(workspace, userId, `Workspace renamed to "${updates.name.trim()}"`);
    workspace.name = updates.name.trim();
  }
  await workspace.save();

  return serializeWorkspace(workspace, plan);
}

export async function createInvite(userId: string, email: string, role: TeamRole = 'member') {
  const user = await getUser(userId);
  const plan = getPlan(user);
  const { maxTeamMembers } = PLAN_CONFIG[plan];

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Create a workspace first before inviting members.');
  requireOwnerOrAdmin(workspace, userId);

  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate: already an active member?
  const allMembers = resolvedMembers(workspace);
  const memberUsers = await User.find({ _id: { $in: allMembers.map(m => m.userId) } })
    .select('email').lean();
  const memberEmails = new Set(memberUsers.map(u => u.email?.toLowerCase()));
  if (memberEmails.has(normalizedEmail)) {
    throw new Error('This person is already a member of your workspace.');
  }

  // Check pending invite for this email
  const existingPending = await TeamInvite.findOne({
    teamId: workspace._id.toString(),
    invitedEmail: normalizedEmail,
    acceptedAt: { $exists: false },
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (existingPending) {
    throw new Error('A pending invitation already exists for this email. Revoke it first to resend.');
  }

  // Check member limit (accepted members + pending invites)
  const pendingCount = await TeamInvite.countDocuments({
    teamId: workspace._id.toString(),
    acceptedAt: { $exists: false },
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  const total = allMembers.length + pendingCount;
  if (total >= maxTeamMembers) {
    throw new PlanError(
      `Member limit reached (${maxTeamMembers} on ${plan} plan). Upgrade to invite more.`,
      'PLAN_LIMIT_REACHED',
      plan === 'free' ? 'pro' : 'team',
    );
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = new TeamInvite({
    teamId: workspace._id.toString(),
    invitedEmail: normalizedEmail,
    invitedByUserId: userId,
    role,
    tokenHash,
    expiresAt,
  });
  await invite.save();

  const inviteUrl = `${config.clientUrl}/team/invite?token=${rawToken}`;
  const inviterName = user.name || user.email;

  // Fire-and-forget: do not await, do not let email failure block the response
  sendTeamInviteEmail(normalizedEmail, inviterName, workspace.name, role, inviteUrl).catch(() => {});

  await addActivityEntry(workspace, userId, `Invited ${normalizedEmail} as ${role}`);
  await workspace.save();

  return {
    inviteId: String(invite._id),
    inviteUrl,
    invitedEmail: normalizedEmail,
    role,
    expiresAt,
  };
}

// Public: no auth required — hashes the raw token to look up the invite
export async function previewInvite(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const invite = await TeamInvite.findOne({ tokenHash }).lean();
  if (!invite) return { status: 'invalid' as const };
  if (invite.revokedAt) return { status: 'revoked' as const };
  if (invite.acceptedAt) return { status: 'accepted' as const };
  if (invite.expiresAt < new Date()) return { status: 'expired' as const };

  const workspace = await TeamWorkspace.findById(invite.teamId).lean();
  if (!workspace) return { status: 'invalid' as const };

  const inviter = await User.findById(invite.invitedByUserId).select('name email').lean();
  const inviterName = inviter?.name || inviter?.email || 'A teammate';

  return {
    status: 'valid' as const,
    inviteId: String(invite._id),
    workspaceName: workspace.name,
    inviterName,
    invitedEmail: invite.invitedEmail,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptInvite(rawToken: string, userId: string) {
  const tokenHash = hashToken(rawToken);

  const invite = await TeamInvite.findOne({ tokenHash });
  if (!invite) throw new Error('Invite not found or invalid.');
  if (invite.revokedAt) throw new Error('This invitation has been revoked.');
  if (invite.acceptedAt) throw new Error('This invitation has already been used.');
  if (invite.expiresAt < new Date()) throw new Error('This invitation has expired.');

  const user = await getUser(userId);
  if (user.email?.toLowerCase() !== invite.invitedEmail) {
    throw new Error(
      `This invite was sent to ${invite.invitedEmail}. Please log in with that account to accept.`,
    );
  }

  const workspace = await TeamWorkspace.findById(invite.teamId);
  if (!workspace) throw new Error('Workspace no longer exists.');

  // Check not already a member
  const allMembers = resolvedMembers(workspace);
  if (allMembers.some(m => m.userId === userId)) {
    throw new Error('You are already a member of this workspace.');
  }

  // Add member to workspace
  workspace.members = allMembers; // persist migrated state
  workspace.members.push({ userId, role: invite.role, joinedAt: new Date() });

  invite.acceptedAt = new Date();
  await invite.save();

  await addActivityEntry(workspace, userId, `${user.name || user.email} joined as ${invite.role}`);
  await workspace.save();

  return { ok: true, workspaceName: workspace.name };
}

export async function revokeInvite(userId: string, inviteId: string) {
  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Workspace not found.');
  requireOwnerOrAdmin(workspace, userId);

  const invite = await TeamInvite.findById(inviteId);
  if (!invite || invite.teamId !== workspace._id.toString()) {
    throw new Error('Invite not found.');
  }
  if (invite.revokedAt || invite.acceptedAt) {
    throw new Error('This invite is no longer active.');
  }

  invite.revokedAt = new Date();
  await invite.save();

  await addActivityEntry(workspace, userId, `Revoked invite for ${invite.invitedEmail}`);
  await workspace.save();

  return { ok: true };
}

export async function regenerateInvite(userId: string, inviteId: string) {
  const user = await getUser(userId);
  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Workspace not found.');
  requireOwnerOrAdmin(workspace, userId);

  const oldInvite = await TeamInvite.findById(inviteId);
  if (!oldInvite || oldInvite.teamId !== workspace._id.toString()) {
    throw new Error('Invite not found.');
  }

  // Revoke old invite
  oldInvite.revokedAt = new Date();
  await oldInvite.save();

  // Create new invite for same email + role
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newInvite = new TeamInvite({
    teamId: workspace._id.toString(),
    invitedEmail: oldInvite.invitedEmail,
    invitedByUserId: userId,
    role: oldInvite.role,
    tokenHash,
    expiresAt,
  });
  await newInvite.save();

  const inviteUrl = `${config.clientUrl}/team/invite?token=${rawToken}`;
  const inviterName = user.name || user.email;

  sendTeamInviteEmail(oldInvite.invitedEmail, inviterName, workspace.name, oldInvite.role, inviteUrl).catch(() => {});

  await addActivityEntry(workspace, userId, `Regenerated invite for ${oldInvite.invitedEmail}`);
  await workspace.save();

  return {
    inviteId: String(newInvite._id),
    inviteUrl,
    invitedEmail: newInvite.invitedEmail,
    role: newInvite.role,
    expiresAt,
  };
}

export async function updateMemberRole(userId: string, targetUserId: string, role: TeamRole) {
  if (role === 'owner') throw new Error('Cannot assign the owner role.');

  const user = await getUser(userId);
  const plan = getPlan(user);
  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Workspace not found.');
  requireOwner(workspace, userId);

  if (targetUserId === userId) throw new Error('You cannot change your own role.');

  const allMembers = resolvedMembers(workspace);
  const target = allMembers.find(m => m.userId === targetUserId);
  if (!target) throw new Error('Member not found in workspace.');

  workspace.members = allMembers.map(m =>
    m.userId === targetUserId ? { ...m, role } : m,
  );

  const targetUser = await User.findById(targetUserId).select('name email').lean();
  const targetName = targetUser?.name || targetUser?.email || targetUserId;
  await addActivityEntry(workspace, userId, `Changed ${targetName}'s role to ${role}`);
  await workspace.save();

  return serializeWorkspace(workspace, plan);
}

export async function removeMember(userId: string, targetUserId: string) {
  if (targetUserId === userId) throw new Error('You cannot remove yourself from the workspace.');

  const user = await getUser(userId);
  const plan = getPlan(user);
  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Workspace not found.');
  requireOwnerOrAdmin(workspace, userId);

  const allMembers = resolvedMembers(workspace);
  const target = allMembers.find(m => m.userId === targetUserId);
  if (!target) throw new Error('Member not found in workspace.');
  if (target.role === 'owner') throw new Error('Cannot remove the workspace owner.');

  workspace.members = allMembers.filter(m => m.userId !== targetUserId);

  const targetUser = await User.findById(targetUserId).select('name email').lean();
  const targetName = targetUser?.name || targetUser?.email || targetUserId;
  await addActivityEntry(workspace, userId, `Removed ${targetName} from workspace`);
  await workspace.save();

  return serializeWorkspace(workspace, plan);
}

export async function addSharedProject(userId: string, name: string, description: string) {
  const user = await getUser(userId);
  const plan = getPlan(user);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found. Create one first.');
  requireOwnerOrAdmin(workspace, userId);

  const project = {
    id: randomUUID(),
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: new Date(),
  };

  workspace.sharedProjects.push(project);
  await addActivityEntry(workspace, userId, `Created shared project "${name}"`);
  await workspace.save();

  return { sharedProjects: workspace.sharedProjects };
}

export async function deleteSharedProject(userId: string, projectId: string) {
  const user = await getUser(userId);
  const plan = getPlan(user);

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');
  requireOwnerOrAdmin(workspace, userId);

  const project = workspace.sharedProjects.find((p: { id: string }) => p.id === projectId);
  workspace.sharedProjects = workspace.sharedProjects.filter(
    (p: { id: string }) => p.id !== projectId,
  );
  if (project) {
    await addActivityEntry(workspace, userId, `Deleted project "${project.name}"`);
  }
  await workspace.save();

  return { sharedProjects: workspace.sharedProjects };
}

export async function generateTeamWeeklyReport(userId: string): Promise<{
  activitySummary: string;
  sharedPriorities: string[];
  executionRisks: string[];
  suggestedNextActions: string[];
  memberCount: number;
  projectCount: number;
}> {
  const user = await getUser(userId);
  const plan = getPlan(user);
  if (!PLAN_CONFIG[plan].canUseTeamReports) {
    throw new PlanError('Team weekly reports require a Team plan', 'TEAM_PLAN_REQUIRED', 'team');
  }

  const workspace = await TeamWorkspace.findOne({ ownerId: userId });
  if (!workspace) throw new Error('Team workspace not found');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = (workspace.activityFeed || [])
    .filter((a: { timestamp: Date }) => new Date(a.timestamp) >= oneWeekAgo)
    .slice(-20);

  const activeTasks = await Task.find({ userId }).limit(50);
  const highPriorityTasks = activeTasks.filter(t => !t.completed && t.priority === 'high');

  const allMembers = resolvedMembers(workspace);
  const pendingCount = await TeamInvite.countDocuments({
    teamId: workspace._id.toString(),
    acceptedAt: { $exists: false },
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  const memberCount = allMembers.length;
  const projectCount = workspace.sharedProjects.length;

  const contextStr = `
Team workspace: ${workspace.name}
Members: ${memberCount} accepted, ${pendingCount} pending
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
      // fall through to static fallback
    }
  }

  return {
    activitySummary:
      recentActivity.length > 0
        ? `${recentActivity.length} activities recorded this week across the team workspace.`
        : 'No recent team activity recorded this week. Encourage team members to update shared projects.',
    sharedPriorities: highPriorityTasks.slice(0, 3).map(t => t.title),
    executionRisks: [
      highPriorityTasks.length > 5 ? 'Multiple high-priority items may dilute focus' : '',
      memberCount <= 1 ? 'Team has no active members yet — invite collaborators' : '',
    ].filter(Boolean),
    suggestedNextActions: [
      projectCount === 0
        ? 'Create your first shared project'
        : `Review progress on "${workspace.sharedProjects[0]?.name}"`,
      highPriorityTasks[0]
        ? `Address: ${highPriorityTasks[0].title}`
        : 'Add high-priority tasks to the workspace',
      'Schedule a team sync to align on priorities',
    ],
    memberCount,
    projectCount,
  };
}
