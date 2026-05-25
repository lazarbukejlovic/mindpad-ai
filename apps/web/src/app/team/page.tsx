'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  Users, Plus, Trash2, AlertCircle, CheckCircle2, Pencil, Zap,
  FolderKanban, Activity, BarChart2, Sparkles, Lock, RefreshCw, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { TeamWorkspaceState, TeamWorkspace, TeamWeeklyReport, SharedProject, ActivityEntry } from '@/types/index';
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

export default function TeamPage() {
  const { checking } = useSessionRestore();
  const [state, setState]               = useState<TeamWorkspaceState | null>(null);
  const [loading, setLoading]           = useState(true);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingName, setEditingName]   = useState(false);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviting, setInviting]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Shared projects
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [addingProject, setAddingProject]   = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

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
    try {
      const res = await ApiClient.inviteTeamMember(inviteEmail.trim());
      setState(prev => prev?.workspace ? { ...prev, workspace: { ...prev.workspace!, invitedEmails: res.invitedEmails, memberCount: res.invitedEmails.length + (prev.workspace?.memberIds.length ?? 0) + 1 } } : prev);
      setInviteEmail('');
      showMsg('success', 'Invitation sent.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to invite');
    } finally { setInviting(false); }
  }

  async function handleRemoveInvite(email: string) {
    try {
      const res = await ApiClient.removeTeamInvite(email);
      setState(prev => prev?.workspace ? { ...prev, workspace: { ...prev.workspace!, invitedEmails: res.invitedEmails, memberCount: res.invitedEmails.length + (prev.workspace?.memberIds.length ?? 0) + 1 } } : prev);
      showMsg('success', 'Invite removed.');
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Failed to remove invite');
    }
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

  function showMsg(type: 'success' | 'error', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  const ws = state?.workspace as TeamWorkspace | undefined;

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="lg" />
      </div>
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
                    {ws ? `${ws.memberCount} member${ws.memberCount !== 1 ? 's' : ''} · ${ws.sharedProjects?.length ?? 0} projects` : 'Collaborate with your team'}
                  </p>
                </div>
              </div>
              {ws && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: 'rgba(120,80,200,0.15)', border: '1px solid rgba(150,100,240,0.3)',
                  color: '#a78bfa', letterSpacing: '0.06em',
                }}>TEAM</span>
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

            {/* ── Gate: non-team plan ── */}
            {state?.upgradeRequired && (
              <div style={{ ...panel, padding: '32px', textAlign: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={26} style={{ color: 'rgba(130,100,220,0.6)' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 12 }}>
                  Team Workspace requires a Team plan
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
                  Upgrade to Team to unlock shared workspaces, member invites, shared projects, team analytics, admin controls, and Team Weekly Reports.
                </p>

                <div style={{ display: 'grid', gap: 10, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }} className="md:grid-cols-2">
                  {[
                    { icon: Users, label: 'Up to 10 team members' },
                    { icon: FolderKanban, label: 'Shared projects' },
                    { icon: Activity, label: 'Team activity feed' },
                    { icon: BarChart2, label: 'Team analytics + reports' },
                    { icon: Shield, label: 'Admin controls' },
                    { icon: Sparkles, label: 'Team weekly AI report' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderRadius: 10, background: 'rgba(120,80,200,0.05)', border: '1px solid rgba(150,100,240,0.12)',
                    }}>
                      <Icon size={14} style={{ color: 'rgba(130,100,220,0.6)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(140,120,200,0.8)' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <Link href="/pricing" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 24px', borderRadius: 11, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  border: '1px solid rgba(124,58,237,0.5)', color: '#fff',
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                }}>
                  <Zap size={14} /> Upgrade to Team — $29/month
                </Link>
              </div>
            )}

            {/* ── No workspace yet (team plan) ── */}
            {!state?.upgradeRequired && !ws && (
              <div style={{ ...panel, padding: '32px', maxWidth: 500 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 8 }}>
                  Create your Team Workspace
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.7)', marginBottom: 20 }}>
                  Set up a workspace to invite your team, share projects, and collaborate.
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Workspace</span>
                    <button
                      onClick={() => setEditingName(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(80,110,160,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Pencil size={12} />{editingName ? 'Cancel' : 'Rename'}
                    </button>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {editingName ? (
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
                          width: 40, height: 40, borderRadius: 12,
                          background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                      Members <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(70,100,140,0.7)', marginLeft: 4 }}>{ws.memberCount} / 10</span>
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
                        background: 'rgba(0,130,255,0.06)', border: '1px solid rgba(0,160,255,0.12)', marginBottom: 8,
                      }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(120,80,200,0.2)', border: '1px solid rgba(150,100,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={14} style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>You (owner)</p>
                          <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)' }}>Admin</p>
                        </div>
                      </div>
                      {ws.invitedEmails.map(email => (
                        <div key={email} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: '10px 12px', borderRadius: 9, marginBottom: 6,
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.08)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Users size={13} style={{ color: '#40b8ff' }} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, color: 'rgba(160,200,240,0.85)' }}>{email}</p>
                              <p style={{ fontSize: 10, color: 'rgba(70,100,140,0.5)' }}>Invited — pending</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveInvite(email)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(90,120,160,0.4)', padding: 4 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {ws.memberCount < 10 ? (
                      <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="email" value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="teammate@company.com"
                          required
                          style={{
                            flex: 1, height: 40, padding: '0 12px', borderRadius: 9,
                            border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
                            color: 'rgba(200,220,245,0.9)', fontSize: 13, outline: 'none',
                          }}
                        />
                        <Button type="submit" size="sm" loading={inviting}>
                          <Plus size={13} /> Invite
                        </Button>
                      </form>
                    ) : (
                      <p style={{ fontSize: 12, color: 'rgba(70,100,140,0.6)' }}>Member limit reached (10 / 10).</p>
                    )}
                  </div>
                </div>

                {/* Shared Projects */}
                <div style={panel}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <FolderKanban size={14} style={{ color: '#40b8ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                        Shared Projects <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(70,100,140,0.7)', marginLeft: 4 }}>({(ws.sharedProjects ?? []).length})</span>
                      </span>
                    </div>
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
                        No shared projects yet. Add one to collaborate with your team.
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
                                  Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(90,120,160,0.35)', padding: 4, flexShrink: 0 }}
                            >
                              <Trash2 size={13} />
                            </button>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(ws.activityFeed ?? []).slice(0, 20).map((entry: ActivityEntry) => (
                          <div key={entry.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: 'rgba(140,180,230,0.8)', padding: '6px 0', borderBottom: '1px solid rgba(0,160,255,0.04)' }}>
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
                      <RefreshCw size={14} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Team Weekly Execution Report</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {report && (
                        <button onClick={() => setReport(null)} style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Regenerate
                        </button>
                      )}
                      {!report && (
                        <Button size="sm" onClick={handleGenerateReport} loading={reportLoading}>
                          <Sparkles size={12} /> Generate
                        </Button>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {!report ? (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                        Generate your team's weekly execution report — activity summary, shared priorities, execution risks, and suggested next actions.
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

                {/* Admin Controls */}
                <div style={{ ...panel, borderColor: 'rgba(80,60,160,0.15)' }}>
                  <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Shield size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Admin Controls</span>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ display: 'grid', gap: 10 }} className="md:grid-cols-2">
                      {[
                        { label: 'Workspace owner', value: 'You' },
                        { label: 'Plan', value: 'Team' },
                        { label: 'Member slots', value: `${ws.memberCount} / 10` },
                        { label: 'Active projects', value: String(ws.sharedProjects?.length ?? 0) },
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
