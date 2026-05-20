'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTodo, CheckCircle2, CalendarDays, Clock,
  Sparkles, Brain, Timer, ArrowRight, Flame, Zap,
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary, Task, BrainDump } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import KPICard from '@/components/ui/KPICard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import NeuralBackground from '@/components/ui/NeuralBackground';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const priorityVariant = { high: 'danger', medium: 'warning', low: 'success' } as const;

/* Reusable premium section card */
function PanelCard({ title, action, children }: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(5, 10, 22, 0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 160, 255, 0.12)',
      borderRadius: '1rem',
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.24)';
        (e.currentTarget as HTMLElement).style.boxShadow   = '0 0 40px rgba(0,60,180,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.12)';
        (e.currentTarget as HTMLElement).style.boxShadow   = 'none';
      }}
    >
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{title}</span>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: title ? '16px 20px 20px' : '20px' }}>
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [analytics, setAnalytics]       = useState<AnalyticsSummary | null>(null);
  const [brainDumps, setBrainDumps]     = useState<BrainDump[]>([]);
  const [userEmail, setUserEmail]       = useState('');
  const [error, setError]               = useState('');
  const [brief, setBrief]               = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) { setLoading(false); router.push('/login'); return; }
    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [tasksData, analyticsData, brainDumpsData, meData] = await Promise.all([
        ApiClient.getTasks(), ApiClient.getAnalyticsSummary(),
        ApiClient.getBrainDumps(), ApiClient.getMe(),
      ]);
      setTasks(tasksData as Task[]);
      setAnalytics(analyticsData);
      setBrainDumps((brainDumpsData as BrainDump[]).slice(0, 3));
      setUserEmail(meData.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleTask(task: Task) {
    try {
      const updated = await ApiClient.updateTask(task.id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === task.id ? (updated as Task) : t));
    } catch { /* silent */ }
  }

  async function handleGenerateBrief() {
    setBriefLoading(true);
    try {
      const activeTitles = activeTasks.slice(0, 5).map(t => t.title).join(', ');
      const result = await ApiClient.getMorningBrief(activeTitles);
      setBrief(result.briefText);
    } catch {
      setBrief('Could not generate brief. Make sure the API is running.');
    } finally {
      setBriefLoading(false);
    }
  }

  const activeTasks   = tasks.filter(t => !t.completed);
  const completedToday = tasks.filter(t =>
    t.completed && new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length;
  const displayName = userEmail ? userEmail.split('@')[0] : '';
  const dateLabel   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {error && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* ── Header ── */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <h1 style={{
                    fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 6, lineHeight: 1.2,
                  }}>
                    {getGreeting()}{displayName ? `, ${displayName}` : ''}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.9)' }}>{dateLabel}</p>
                    {analytics && analytics.weeklyStreak >= 3 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#ffb700' }}>
                        <Flame size={13} />
                        {analytics.weeklyStreak}-day streak
                      </div>
                    )}
                  </div>
                </div>
                {/* AI status badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 99,
                  background: 'rgba(0,130,255,0.08)',
                  border: '1px solid rgba(0,160,255,0.18)',
                  flexShrink: 0,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00c0ff', boxShadow: '0 0 8px rgba(0,200,255,0.9)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,200,255,0.85)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Online</span>
                  <Zap size={11} style={{ color: 'rgba(255,185,0,0.8)' }} />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, paddingBottom: 80 }}>
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* ── KPI Row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}
                  className="md:grid-cols-4">
                  <KPICard label="Total Tasks"  value={tasks.length}                      sub={`${activeTasks.length} active`} icon={ListTodo}    accentColor="#00a0ff" />
                  <KPICard label="Completed"    value={analytics?.completedTasks ?? 0}  sub="all time"                       icon={CheckCircle2} accentColor="#22c55e" />
                  <KPICard label="Today"        value={completedToday}                   sub="tasks done"                     icon={CalendarDays} accentColor="#a78bfa" />
                  <KPICard label="Focus Time"   value={analytics?.totalFocusMinutes ?? 0} sub="total minutes"                icon={Clock}        accentColor="#ffb700" />
                </div>

                <div style={{ display: 'grid', gap: 24 }} className="md:grid-cols-3">
                  {/* Left 2/3 */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* AI Morning Brief */}
                    <PanelCard
                      title="AI Morning Brief"
                      action={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#40b8ff', letterSpacing: '0.04em' }}>
                          <Sparkles size={12} />MindPad AI
                        </div>
                      }
                    >
                      {!brief ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)', lineHeight: 1.6 }}>
                            Generate a personalized AI brief based on your active tasks.
                          </p>
                          <Button size="sm" onClick={handleGenerateBrief} loading={briefLoading}>
                            <Sparkles size={13} /> Generate Brief
                          </Button>
                        </div>
                      ) : (
                        <div style={{ paddingLeft: 16, borderLeft: '2px solid rgba(0,160,255,0.5)', fontSize: 13, color: 'rgba(200,220,240,0.9)', lineHeight: 1.7 }}>
                          {brief}
                        </div>
                      )}
                    </PanelCard>

                    {/* Today's Focus */}
                    <PanelCard
                      title="Today's Focus"
                      action={
                        <Link href="/tasks" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#40b8ff', textDecoration: 'none' }}>
                          View all <ArrowRight size={11} />
                        </Link>
                      }
                    >
                      {activeTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <CheckCircle2 size={28} style={{ margin: '0 auto 10px', color: 'rgba(0,160,255,0.3)' }} />
                          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)', marginBottom: 8 }}>No active tasks</p>
                          <Link href="/brain-dump" style={{ fontSize: 12, color: '#40b8ff', textDecoration: 'none' }}>
                            Extract tasks from a brain dump →
                          </Link>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {activeTasks.slice(0, 5).map(task => (
                            <div key={task.id} style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', borderRadius: 10, cursor: 'default',
                              transition: 'background 0.15s',
                              background: 'rgba(0,0,0,0)',
                            }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,100,200,0.05)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'}
                            >
                              <button
                                onClick={() => handleToggleTask(task)}
                                style={{
                                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                  border: '1.5px solid rgba(0,160,255,0.3)',
                                  background: 'transparent', cursor: 'pointer',
                                  transition: 'border-color 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.8)';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px rgba(0,160,255,0.3)';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.3)';
                                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                              />
                              <p style={{ flex: 1, fontSize: 13, color: 'rgba(200,220,240,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.title}
                              </p>
                              <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                            </div>
                          ))}
                          {activeTasks.length > 5 && (
                            <Link href="/tasks" style={{ textAlign: 'center', fontSize: 12, color: 'rgba(90,120,160,0.7)', paddingTop: 8, textDecoration: 'none', display: 'block' }}>
                              +{activeTasks.length - 5} more tasks
                            </Link>
                          )}
                        </div>
                      )}
                    </PanelCard>
                  </div>

                  {/* Right 1/3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Quick actions */}
                    <PanelCard title="Quick Actions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { href: '/brain-dump', icon: Brain,   label: 'New Brain Dump', primary: true },
                          { href: '/focus',      icon: Timer,   label: 'Start Focus',    primary: false },
                          { href: '/tasks',      icon: ListTodo,label: 'Manage Tasks',   primary: false },
                        ].map(({ href, icon: Icon, label, primary }) => (
                          <Link key={href} href={href} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                            textDecoration: 'none', transition: 'all 0.15s',
                            color: primary ? '#50c8ff' : 'rgba(110,150,190,0.8)',
                            background: primary ? 'rgba(0,130,255,0.08)' : 'transparent',
                            border: primary ? '1px solid rgba(0,160,255,0.14)' : '1px solid transparent',
                          }}
                            onMouseEnter={e => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.background = primary ? 'rgba(0,130,255,0.14)' : 'rgba(0,100,200,0.06)';
                              el.style.color = '#80d8ff';
                            }}
                            onMouseLeave={e => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.background = primary ? 'rgba(0,130,255,0.08)' : 'transparent';
                              el.style.color = primary ? '#50c8ff' : 'rgba(110,150,190,0.8)';
                            }}
                          >
                            <Icon size={15} />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </PanelCard>

                    {/* Recent notes */}
                    <PanelCard
                      title="Recent Notes"
                      action={
                        <Link href="/brain-dump" style={{ fontSize: 11, fontWeight: 700, color: '#40b8ff', textDecoration: 'none' }}>
                          All →
                        </Link>
                      }
                    >
                      {brainDumps.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)', textAlign: 'center', padding: '16px 0' }}>No notes yet</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {brainDumps.map(dump => (
                            <div key={dump.id} style={{
                              padding: 12, borderRadius: 10,
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(0,160,255,0.08)',
                            }}>
                              <p style={{ fontSize: 10, color: 'rgba(70,100,140,0.8)', marginBottom: 5 }}>
                                {new Date(dump.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p style={{ fontSize: 12, color: 'rgba(180,210,240,0.8)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {dump.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </PanelCard>

                    {/* Progress */}
                    {analytics && analytics.totalTasks > 0 && (
                      <PanelCard title="Overall Progress">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 28, fontWeight: 800, color: '#60c8ff' }}>
                            {Math.round((analytics.completedTasks / analytics.totalTasks) * 100)}%
                          </span>
                          <span style={{ fontSize: 12, color: 'rgba(90,120,160,0.8)' }}>
                            {analytics.completedTasks}/{analytics.totalTasks}
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            background: 'linear-gradient(90deg, #0092f0, #40c8ff)',
                            boxShadow: '0 0 12px rgba(0,160,255,0.5)',
                            width: `${Math.round((analytics.completedTasks / analytics.totalTasks) * 100)}%`,
                            transition: 'width 0.7s ease',
                          }} />
                        </div>
                      </PanelCard>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
