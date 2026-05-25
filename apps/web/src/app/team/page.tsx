'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  Users, Plus, Trash2, AlertCircle, CheckCircle2, Pencil, Zap,
  FolderKanban, Activity, BarChart2, Sparkles, RefreshCw, Shield,
  Copy, Check, ChevronDown, Link2, UserMinus,
} from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { TeamWorkspaceState, TeamWorkspace, TeamWeeklyReport, SharedProject, ActivityEntry, TeamMember, TeamPendingInvite, TeamRole } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import NeuralBackground from '@/components/ui/NeuralBackground';

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1rem',
};

const ROLE_LABELS: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };
const ROLE_COLORS: Record<TeamRole, string> = {
  owner: '#a78bfa',
  admin: '#40b8ff',
  member: 'rgba(100,130,170,0.8)',
};

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: `${ROLE_COLORS[role]}18`,
      border: `1px solid ${ROLE_COLORS[role]}40`,
      color: ROLE_COLORS[role],
      letterSpacing: '0.05em',
    }}>{ROLE_LABELS[role]}</span>
  );
}

function MemberAvatar({ member }: { member: TeamMember }) {
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl} alt=""
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const initials = (member.name || member.email || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(100,80,200,0.15)', border: '1px solid rgba(150,100,240,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#a78bfa',
    }}>{initials}</div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={doCopy}
      title="Copy"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(0,100,200,0.1)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(0,160,255,0.2)'}`,
        color: copied ? '#6ee7b7' : '#40b8ff',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function TeamPage() {
  const { checking } = useSessionRestore();
  const [state, setState]               = useState<TeamWorkspaceState | null>(null);
  const [loading, setLoading]           = useState(true);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingName, setEditingName]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState<TeamRole>('member');
  const [inviting, setInviting]         = useState(false);
  // One-time invite link shown after creation
  const [freshInviteUrl, setFreshInviteUrl] = useState<string | null>(null);
  // Regenerated link
  const [regenResult, setRegenResult]   = useState<{ inviteId: string; inviteUrl: string } | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null); // inviteId

  // Shared projects
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [addingProject, setAddingProject]   = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Member management
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [removingMember, setRemovingMember]     = useState<string | null>(null);

  // Weekly report
  const [report, setReport]             = useState<TeamWeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (checking) return;
    loadWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  async function loadWorkspace() {
    try {
      const data = await ApiClient.getTeamWorkspace();
      setState(data);
      if (data.workspace) setWorkspaceName(data.workspace.name);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setSaving(true);
    try {
      const ws = await ApiClient.createTeamWorkspace(workspaceName.trim());
      setState(prev => prev ? { ...prev, exists: true, workspace: ws } : null);
      showMsg('success', 'Workspace created.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to create workspace');
    } finally { setSaving(false); }
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim() || !state?.workspace) return;
    setSaving(true);
    try {
      const ws = await ApiClient.updateTeamWorkspace(workspaceName.trim());
      setState(prev => prev ? { ...prev, workspace: ws } : null);
      setEditingName(false);
      showMsg('success', 'Workspace renamed.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to rename');
    } finally { setSaving(false); }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setFreshInviteUrl(null);
    setRegenResult(null);
    try {
      const res = await ApiClient.createTeamInvite(inviteEmail.trim(), inviteRole);
      setFreshInviteUrl(res.inviteUrl);
      setInviteEmail('');
      // Add pending invite to local state
      setState(prev => {
        if (!prev?.workspace) return prev;
        const newInvite: TeamPendingInvite = {
          id: res.inviteId,
          invitedEmail: res.invitedEmail,
          role: res.role,
          expiresAt: res.expiresAt,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          workspace: {
            ...prev.workspace!,
            pendingInvites: [...(prev.workspace!.pendingInvites || []), newInvite],
          },
        };
      });
      showMsg('success', 'Invitation created. Share the link below.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to invite');
    } finally { setInviting(false); }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      await ApiClient.revokeTeamInvite(inviteId);
      setState(prev => {
        if (!prev?.workspace) return prev;
        return {
          ...prev,
          workspace: {
            ...prev.workspace!,
            pendingInvites: prev.workspace!.pendingInvites.filter(i => i.id !== inviteId),
          },
        };
      });
      showMsg('success', 'Invite revoked.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to revoke invite');
    }
  }

  async function handleRegenerate(inviteId: string) {
    setRegenLoading(inviteId);
    setFreshInviteUrl(null);
    setRegenResult(null);
    try {
      const res = await ApiClient.regenerateTeamInvite(inviteId);
      setRegenResult({ inviteId: res.inviteId, inviteUrl: res.inviteUrl });
      // Replace old invite with new one
      setState(prev => {
        if (!prev?.workspace) return prev;
        return {
          ...prev,
          workspace: {
            ...prev.workspace!,
            pendingInvites: prev.workspace!.pendingInvites.map(i =>
              i.id === inviteId
                ? { ...i, id: res.inviteId, expiresAt: res.expiresAt }
                : i,
            ),
          },
        };
      });
      showMsg('success', 'New invite link generated. Share the link below.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to regenerate invite');
    } finally { setRegenLoading(null); }
  }

  async function handleRoleChange(targetUserId: string, role: TeamRole) {
    setRoleChangeTarget(targetUserId);
    try {
      const ws = await ApiClient.updateTeamMemberRole(targetUserId, role);
      setState(prev => prev ? { ...prev, workspace: ws } : null);
      showMsg('success', 'Role updated.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to update role');
    } finally { setRoleChangeTarget(null); }
  }

  async function handleRemoveMember(targetUserId: string) {
    setRemovingMember(targetUserId);
    try {
      const ws = await ApiClient.removeTeamMember(targetUserId);
      setState(prev => prev ? { ...prev, workspace: ws } : null);
      showMsg('success', 'Member removed.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to remove member');
    } finally { setRemovingMember(null); }
  }

  async function handleAddProject(e: FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setAddingProject(true);
    try {
      const res = await ApiClient.addSharedProject(newProjectName.trim(), newProjectDesc.trim());
      setState(prev => prev?.workspace ? { ...prev, workspace: { ...prev.workspace!, sharedProjects: res.sharedProjects } } : prev);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowProjectForm(false);
      showMsg('success', 'Project added.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to add project');
    } finally { setAddingProject(false); }
  }

  async function handleDeleteProject(id: string) {
    try {
      const res = await ApiClient.deleteSharedProject(id);
      setState(prev => prev?.workspace ? { ...prev, workspace: { ...prev.workspace!, sharedProjects: res.sharedProjects } } : prev);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to delete project');
    }
  }

  async function handleGenerateReport() {
    setReportLoading(true);
    try {
      const r = await ApiClient.generateTeamWeeklyReport();
      setReport(r);
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to generate report');
    } finally { setReportLoading(false); }
  }

  const ws = state?.workspace as TeamWorkspace | undefined;
  const plan = state?.plan || 'free';
  const maxMembers = ws?.maxMembers ?? state?.entitlements?.maxTeamMembers ?? 1;
  const usedSlots = (ws?.memberCount ?? 0) + (ws?.pendingInvites?.length ?? 0);
  const currentUserRole = ws?.currentUserRole ?? 'member';
  const isOwner = currentUserRole === 'owner';
  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canInvite = isOwnerOrAdmin && usedSlots < maxMembers;

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="lg" />
      </div>
    </div>
  );

  const inviteLinkBox = (url: string, label: string) => (
    <div style={{
      marginTop: 12, padding: '14px 16px', borderRadius: 11,
      background: 'rgba(0,80,200,0.08)', border: '1px solid rgba(0,160,255,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={13} style={{ color: '#40b8ff' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{label}</span>
        </div>
        <CopyButton text={url} />
      </div>
      <p style={{
        fontSize: 11, color: '#40b8ff', wordBreak: 'break-all', margin: 0,
        padding: '8px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.25)',
      }}>{url}</p>
      <p style={{ fontSize: 11, color: 'rgba(80,110,160,0.7)', marginTop: 8, marginBottom: 0 }}>
        This link is shown once. Save it or share it now.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(120,80,200,0.15)',
                }}>
                  <Users size={22} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3,
                  }}>Team Workspace</h1>
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>
                    {ws
                      ? `${ws.memberCount} member${ws.memberCount !== 1 ? 's' : ''} · ${ws.sharedProjects?.length ?? 0} projects`
                      : 'Collaborate with your team'}
                  </p>
                </div>
              </div>
              {ws && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: 'rgba(120,80,200,0.15)', border: '1px solid rgba(150,100,240,0.3)',
                  color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{plan}</span>
              )}
            </div>

            {/* Message */}
            {msg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
                borderRadius: 12, marginBottom: 20,
                background: msg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                border: `1px solid ${msg.type === 'success' ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
                color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5', fontSize: 13,
              }}>
                {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {msg.text}
              </div>
            )}

            {/* ── No workspace yet ── */}
            {!ws && (
              <div style={{ ...panel, padding: '32px', maxWidth: 500 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 8 }}>
                  Create your Team Workspace
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.7)', marginBottom: 20 }}>
                  Set up a workspace to invite collaborators, share projects, and track team activity.
                  {plan === 'free' && ' Free plan includes 1 seat (just you). Upgrade to Pro to invite teammates.'}
                </p>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={workspaceName}
                    onChange={e => setWorkspaceName(e.target.value)}
                    placeholder="Workspace name (e.g. Product Team)"
                    required
                    style={{
                      flex: 1, height: 42, padding: '0 14px', borderRadius: 10,
                      border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
                      color: 'rgba(200,220,245,0.9)', fontSize: 14, outline: 'none',
                    }}
                  />
                  <Button type="submit" loading={saving}>Create</Button>
                </form>
              </div>
            )}

            {/* ── Full Workspace UI ── */}
            {ws && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Workspace Name */}
                <div style={panel}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Workspace</span>
                      <RoleBadge role={currentUserRole} />
                    </div>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => setEditingName(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(80,110,160,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Pencil size={12} />{editingName ? 'Cancel' : 'Rename'}
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {isOwnerOrAdmin && editingName ? (
                      <form onSubmit={handleRename} style={{ display: 'flex', gap: 10 }}>
                        <input
                          value={workspaceName}
                          onChange={e => setWorkspaceName(e.target.value)}
                          style={{
                            flex: 1, height: 40, padding: '0 12px', borderRadius: 9,
                            border: '1px solid rgba(0,160,255,0.2)', background: 'rgba(0,0,0,0.4)',
                            color: 'rgba(200,220,245,0.9)', fontSize: 14, outline: 'none',
                          }}
                        />
                        <Button type="submit" size="sm" loading={saving}>Save</Button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Users size={18} style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(200,220,245,0.95)' }}>{ws.name}</p>
                          <p style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)' }}>
                            Created {new Date(ws.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div style={panel}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Users size={14} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                        Members
                      </span>
                      <span style={{ fontSize: 11, color: usedSlots >= maxMembers ? '#ef4444' : 'rgba(70,100,140,0.7)' }}>
                        {usedSlots} / {maxMembers}
                      </span>
                    </div>
                    {!canInvite && plan !== 'team' && (
                      <Link href="/pricing" style={{
                        fontSize: 11, fontWeight: 600, color: '#a78bfa', textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Zap size={11} /> Upgrade for more
                      </Link>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {/* Member list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {(ws.members || []).map(member => (
                        <div key={member.userId} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: '10px 12px', borderRadius: 9,
                          background: member.role === 'owner' ? 'rgba(120,80,200,0.06)' : 'rgba(0,0,0,0.25)',
                          border: `1px solid ${member.role === 'owner' ? 'rgba(150,100,240,0.18)' : 'rgba(0,160,255,0.08)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <MemberAvatar member={member} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.name || member.email || member.userId}
                              </p>
                              {member.name && member.email && (
                                <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <RoleBadge role={member.role} />
                            {/* Role change + remove: owner only, not for own row */}
                            {isOwner && member.role !== 'owner' && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <select
                                  value={member.role}
                                  onChange={e => handleRoleChange(member.userId, e.target.value as TeamRole)}
                                  disabled={roleChangeTarget === member.userId}
                                  title="Change role"
                                  style={{
                                    fontSize: 11, background: 'rgba(0,0,0,0.35)',
                                    border: '1px solid rgba(0,160,255,0.12)', borderRadius: 6,
                                    color: 'rgba(140,170,210,0.7)', padding: '2px 4px', cursor: 'pointer', outline: 'none',
                                  }}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  disabled={removingMember === member.userId}
                                  title="Remove member"
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(90,120,160,0.4)', padding: 4, borderRadius: 5,
                                    display: 'flex', alignItems: 'center',
                                  }}
                                >
                                  <UserMinus size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invite form */}
                    {canInvite ? (
                      <form onSubmit={handleInvite}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="email" value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            required
                            style={{
                              flex: 1, minWidth: 180, height: 40, padding: '0 12px', borderRadius: 9,
                              border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
                              color: 'rgba(200,220,245,0.9)', fontSize: 13, outline: 'none',
                            }}
                          />
                          <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as TeamRole)}
                            style={{
                              height: 40, padding: '0 10px', borderRadius: 9, fontSize: 13,
                              border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
                              color: 'rgba(180,210,240,0.85)', outline: 'none', cursor: 'pointer',
                            }}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button type="submit" size="sm" loading={inviting}>
                            <Plus size={13} /> Invite
                          </Button>
                        </div>
                        {freshInviteUrl && inviteLinkBox(freshInviteUrl, 'Invite link — share this with your teammate')}
                      </form>
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(90,120,160,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Member limit reached ({maxMembers} / {maxMembers}).
                        {plan !== 'team' && (
                          <Link href="/pricing" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
                            Upgrade →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Invites — only owners/admins see this panel */}
                {isOwnerOrAdmin && (ws.pendingInvites?.length ?? 0) > 0 && (
                  <div style={panel}>
                    <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Link2 size={14} style={{ color: '#40b8ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                        Pending Invitations <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(70,100,140,0.7)', marginLeft: 4 }}>({ws.pendingInvites.length})</span>
                      </span>
                    </div>
                    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ws.pendingInvites.map(inv => (
                        <div key={inv.id}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                            padding: '10px 12px', borderRadius: 9,
                            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,160,255,0.08)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Users size={13} style={{ color: '#40b8ff' }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, color: 'rgba(160,200,240,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.invitedEmail}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <RoleBadge role={inv.role} />
                                  <span style={{ fontSize: 10, color: 'rgba(70,100,140,0.5)' }}>
                                    Expires {new Date(inv.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => handleRegenerate(inv.id)}
                                disabled={regenLoading === inv.id}
                                title="Generate new link"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                                  borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                  background: 'rgba(0,100,200,0.08)', border: '1px solid rgba(0,160,255,0.15)',
                                  color: '#40b8ff',
                                }}
                              >
                                <RefreshCw size={11} /> New link
                              </button>
                              <button
                                onClick={() => handleRevokeInvite(inv.id)}
                                title="Revoke invite"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(90,120,160,0.4)', padding: 4 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          {regenResult && regenResult.inviteId === inv.id && inviteLinkBox(regenResult.inviteUrl, 'New invite link — shown once')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Projects */}
                <div style={panel}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <FolderKanban size={14} style={{ color: '#40b8ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                        Shared Projects <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(70,100,140,0.7)', marginLeft: 4 }}>({(ws.sharedProjects ?? []).length})</span>
                      </span>
                    </div>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => setShowProjectForm(v => !v)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                          padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                          background: showProjectForm ? 'rgba(220,38,38,0.08)' : 'rgba(0,100,200,0.1)',
                          border: `1px solid ${showProjectForm ? 'rgba(220,38,38,0.2)' : 'rgba(0,160,255,0.2)'}`,
                          color: showProjectForm ? '#fc8181' : '#40b8ff',
                        }}
                      >
                        <Plus size={12} style={{ transform: showProjectForm ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }} />
                        {showProjectForm ? 'Cancel' : 'Add Project'}
                      </button>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {showProjectForm && (
                      <form onSubmit={handleAddProject} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            placeholder="Project name"
                            required
                            style={{
                              height: 40, padding: '0 12px', borderRadius: 9, fontSize: 13,
                              border: '1px solid rgba(0,160,255,0.2)', background: 'rgba(0,0,0,0.4)',
                              color: 'rgba(200,220,245,0.9)', outline: 'none',
                            }}
                          />
                          <input
                            value={newProjectDesc}
                            onChange={e => setNewProjectDesc(e.target.value)}
                            placeholder="Short description (optional)"
                            style={{
                              height: 38, padding: '0 12px', borderRadius: 9, fontSize: 12,
                              border: '1px solid rgba(0,160,255,0.12)', background: 'rgba(0,0,0,0.4)',
                              color: 'rgba(200,220,245,0.9)', outline: 'none',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" size="sm" loading={addingProject}>Add Project</Button>
                          </div>
                        </div>
                      </form>
                    )}
                    {(ws.sharedProjects ?? []).length === 0 ? (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.6)', textAlign: 'center', padding: '16px 0' }}>
                        No shared projects yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(ws.sharedProjects ?? []).map((project: SharedProject) => (
                          <div key={project.id} style={{
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                            padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.1)',
                          }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <FolderKanban size={14} style={{ color: '#40b8ff', marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{project.name}</p>
                                {project.description && (
                                  <p style={{ fontSize: 11, color: 'rgba(90,120,160,0.7)', marginTop: 2 }}>{project.description}</p>
                                )}
                                <p style={{ fontSize: 10, color: 'rgba(70,100,140,0.5)', marginTop: 4 }}>
                                  {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            {isOwnerOrAdmin && (
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(90,120,160,0.35)', padding: 4, flexShrink: 0 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Feed */}
                {(ws.activityFeed ?? []).length > 0 && (
                  <div style={panel}>
                    <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Activity size={14} style={{ color: '#40b8ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Activity Feed</span>
                    </div>
                    <div style={{ padding: '16px 20px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(ws.activityFeed ?? []).slice(0, 20).map((entry: ActivityEntry) => (
                          <div key={entry.id} style={{
                            display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12,
                            color: 'rgba(140,180,230,0.8)', padding: '6px 0',
                            borderBottom: '1px solid rgba(0,160,255,0.04)',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,160,255,0.4)', flexShrink: 0, marginTop: 5 }} />
                            <span style={{ flex: 1 }}>{entry.action}</span>
                            <span style={{ fontSize: 10, color: 'rgba(70,100,140,0.5)', flexShrink: 0 }}>
                              {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Weekly Report */}
                <div style={{ ...panel, borderLeft: '3px solid rgba(124,58,237,0.5)' }}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart2 size={14} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Team Weekly Execution Report</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {report && (
                        <button onClick={() => setReport(null)} style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Regenerate
                        </button>
                      )}
                      {!report && plan === 'team' && (
                        <Button size="sm" onClick={handleGenerateReport} loading={reportLoading}>
                          <Sparkles size={12} /> Generate
                        </Button>
                      )}
                      {!report && plan !== 'team' && (
                        <Link href="/pricing" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                          background: 'rgba(120,80,200,0.08)', border: '1px solid rgba(150,100,240,0.2)',
                          color: '#a78bfa', textDecoration: 'none',
                        }}>
                          <Zap size={11} /> Team plan
                        </Link>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {!report ? (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                        {plan === 'team'
                          ? 'Generate your team\'s weekly execution report — activity summary, shared priorities, risks, and suggested next actions.'
                          : 'Team weekly AI reports require a Team plan.'}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)' }}>
                            <span style={{ color: '#a78bfa', fontWeight: 700 }}>{report.memberCount}</span> members
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)' }}>
                            <span style={{ color: '#40b8ff', fontWeight: 700 }}>{report.projectCount}</span> projects
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.7 }}>{report.activitySummary}</p>
                        <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2">
                          {report.sharedPriorities.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,130,255,0.05)', border: '1px solid rgba(0,160,255,0.12)' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#40b8ff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Shared Priorities</p>
                              {report.sharedPriorities.map((p, i) => (
                                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(120,80,200,0.1)', borderRadius: 4, padding: '1px 4px', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                  <span style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{p}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {report.executionRisks.length > 0 && (
                            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Execution Risks</p>
                              {report.executionRisks.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 5 }} />
                                  <span style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(90,120,160,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Suggested Next Actions</p>
                          {report.suggestedNextActions.map((action, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)', borderRadius: 5, padding: '1px 5px', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                              <span style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin info */}
                <div style={{ ...panel, borderColor: 'rgba(80,60,160,0.15)' }}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Shield size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Workspace Info</span>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ display: 'grid', gap: 10 }} className="md:grid-cols-2">
                      {[
                        { label: 'Plan', value: plan.charAt(0).toUpperCase() + plan.slice(1) },
                        { label: 'Member slots', value: `${usedSlots} / ${maxMembers}` },
                        { label: 'Active members', value: String(ws.memberCount) },
                        { label: 'Shared projects', value: String(ws.sharedProjects?.length ?? 0) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,160,255,0.07)' }}>
                          <span style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)' }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Link href="/settings" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(120,80,200,0.08)', border: '1px solid rgba(150,100,240,0.18)',
                        color: '#a78bfa', textDecoration: 'none',
                      }}>
                        Manage Billing →
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
