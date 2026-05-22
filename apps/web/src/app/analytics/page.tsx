'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, CheckCircle2, Clock, Flame, ListTodo, Percent, Moon, Sparkles,
  FileText, RefreshCw, Copy, Check,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary, WeeklyReview, ExportSummary } from '@/types/index';
import { useBilling } from '@/hooks/useBilling';
import AppNav from '@/components/layout/AppNav';
import KPICard from '@/components/ui/KPICard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import NeuralBackground from '@/components/ui/NeuralBackground';

function simulateWeeklyData(totalCompleted: number, totalMinutes: number) {
  const weights = [0.08, 0.12, 0.18, 0.22, 0.17, 0.14, 0.09];
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => ({
    day,
    tasks:   Math.round(totalCompleted * weights[i]),
    minutes: Math.round(totalMinutes * weights[i]),
  }));
}

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1rem',
};

function PanelCard({ title, children, action, accentLeft }: {
  title?: string; children: React.ReactNode;
  action?: React.ReactNode; accentLeft?: boolean;
}) {
  return (
    <div style={{ ...panel, ...(accentLeft ? { borderLeft: '3px solid rgba(0,160,255,0.5)' } : {}) }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: title ? '16px 20px 20px' : '20px' }}>{children}</div>
    </div>
  );
}

function LockedProCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      ...panel,
      marginBottom: 20, padding: '20px 24px',
      borderColor: 'rgba(80,60,160,0.2)',
      background: 'rgba(3, 5, 16, 0.6)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Sparkles size={14} style={{ color: 'rgba(130,100,220,0.7)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(140,120,220,0.8)' }}>{title}</span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 99,
          background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
          color: '#a78bfa', fontWeight: 700,
        }}>PRO</span>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(80,110,160,0.7)', marginBottom: 14 }}>{description}</p>
      <Link href="/pricing" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
        color: '#a78bfa', textDecoration: 'none',
      }}>
        <Sparkles size={11} />Upgrade to Pro
      </Link>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { plan, entitlements, isPro, isTeam } = useBilling();
  const [analytics, setAnalytics]         = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [eveningSummary, setEveningSummary] = useState<{
    summary: string; accomplishments: string[]; unfinished: string[]; tomorrowPriority: string; improvement: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Weekly Review
  const [weeklyReview, setWeeklyReview]     = useState<WeeklyReview | null>(null);
  const [reviewLoading, setReviewLoading]   = useState(false);
  const [reviewError, setReviewError]       = useState('');

  // Export Summary
  const [exportData, setExportData]         = useState<ExportSummary | null>(null);
  const [exportLoading, setExportLoading]   = useState(false);
  const [exportError, setExportError]       = useState('');
  const [copied, setCopied]                 = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    ApiClient.getAnalyticsSummary()
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleEveningSummary() {
    if (!analytics) return;
    setSummaryLoading(true);
    try {
      const accomplishments = [
        analytics.completedTasks > 0 ? `Completed ${analytics.completedTasks} tasks` : '',
        analytics.completedSessions > 0 ? `Finished ${analytics.completedSessions} focus sessions (${analytics.totalFocusMinutes} min)` : '',
        analytics.brainDumpsOrganized > 0 ? `Organized ${analytics.brainDumpsOrganized} brain dumps with AI` : '',
      ].filter(Boolean);
      const result = await ApiClient.getEveningSummary(accomplishments);
      setEveningSummary(result);
    } catch {
      setEveningSummary({ summary: 'Could not generate your summary. Please try again in a moment.', accomplishments: [], unfinished: [], tomorrowPriority: '', improvement: '' });
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleWeeklyReview() {
    setReviewLoading(true);
    setReviewError('');
    try {
      const result = await ApiClient.generateWeeklyReview();
      setWeeklyReview(result);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleExportSummary() {
    setExportLoading(true);
    setExportError('');
    try {
      const result = await ApiClient.generateExportSummary();
      setExportData(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to generate export');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleCopy() {
    if (!exportData?.markdown) return;
    try {
      await navigator.clipboard.writeText(exportData.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  const completionRate = analytics && analytics.totalTasks > 0
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0;

  const weeklyData = analytics
    ? simulateWeeklyData(analytics.completedTasks, analytics.totalFocusMinutes) : [];

  const tooltipStyle = {
    backgroundColor: 'rgba(4, 8, 18, 0.98)',
    border: '1px solid rgba(0,160,255,0.2)',
    borderRadius: '10px',
    color: 'rgba(200,220,245,0.9)',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  const canUsePro = isPro || isTeam;

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,120,255,0.15)',
                }}>
                  <BarChart3 size={22} style={{ color: '#40b8ff' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3,
                  }}>Analytics</h1>
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>Your productivity at a glance</p>
                </div>
              </div>
              {plan && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, letterSpacing: '0.06em',
                  background: plan === 'team' ? 'rgba(120,80,200,0.15)' : plan === 'pro' ? 'rgba(0,100,255,0.1)' : 'rgba(0,0,0,0.3)',
                  border: plan === 'team' ? '1px solid rgba(150,100,240,0.3)' : plan === 'pro' ? '1px solid rgba(0,160,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  color: plan === 'team' ? '#a78bfa' : plan === 'pro' ? '#40b8ff' : 'rgba(90,120,160,0.7)',
                }}>
                  {plan.toUpperCase()}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>
            ) : !analytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0' }}>
                <BarChart3 size={40} style={{ color: 'rgba(90,120,160,0.35)' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(90,120,160,0.7)' }}>No analytics yet</p>
                <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.5)', textAlign: 'center', maxWidth: 280 }}>
                  Complete tasks and focus sessions to start seeing your productivity insights here.
                </p>
              </div>
            ) : (
              <>
                {/* Streak banner */}
                {analytics.weeklyStreak >= 3 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    borderRadius: 12, marginBottom: 24,
                    background: 'rgba(255,150,0,0.08)', border: '1px solid rgba(255,150,0,0.22)',
                  }}>
                    <Flame size={18} style={{ color: '#ffb700', flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#ffb700' }}>
                      {analytics.weeklyStreak}-day streak — keep the momentum going!
                    </p>
                  </div>
                )}

                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}
                  className="md:grid-cols-4">
                  <KPICard label="Total Tasks"  value={analytics.totalTasks}       sub={`${analytics.completedTasks} done`}              icon={ListTodo}    accentColor="#00a0ff" />
                  <KPICard label="Completed"    value={analytics.completedTasks}   sub="all time"                                         icon={CheckCircle2} accentColor="#22c55e" />
                  <KPICard label="Completion"   value={`${completionRate}%`}        sub="rate"                                             icon={Percent}     accentColor="#a78bfa" />
                  <KPICard label="Focus Time"   value={analytics.totalFocusMinutes} sub={`${analytics.completedSessions} sessions`}        icon={Clock}       accentColor="#ffb700" />
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gap: 20, marginBottom: 20 }} className="md:grid-cols-2">
                  <PanelCard title="Completed Tasks (7-day dist.)">
                    {analytics.completedTasks === 0 ? (
                      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(90,120,160,0.7)' }}>
                        Complete some tasks to see the chart
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,160,255,0.07)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(90,120,160,0.7)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'rgba(90,120,160,0.7)' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,100,200,0.06)' }} />
                          <Bar dataKey="tasks" name="Tasks" fill="#0092f0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </PanelCard>

                  <PanelCard title="Focus Minutes (7-day dist.)">
                    {analytics.totalFocusMinutes === 0 ? (
                      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(90,120,160,0.7)' }}>
                        Run some focus sessions to see the chart
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,160,255,0.07)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(90,120,160,0.7)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'rgba(90,120,160,0.7)' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Line type="monotone" dataKey="minutes" name="Minutes"
                            stroke="#40b8ff" strokeWidth={2}
                            dot={{ r: 3, fill: '#0092f0' }} activeDot={{ r: 5, fill: '#40c8ff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </PanelCard>
                </div>

                {/* Completion + sessions */}
                <div style={{ display: 'grid', gap: 20, marginBottom: 20 }} className="md:grid-cols-2">
                  <PanelCard title="Task Completion Rate">
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 42, fontWeight: 800, color: '#60c8ff', letterSpacing: '-0.03em' }}>
                        {completionRate}%
                      </span>
                      <span style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)', paddingBottom: 6 }}>
                        {analytics.completedTasks}/{analytics.totalTasks} tasks
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: 'linear-gradient(90deg, #0092f0, #40c8ff)',
                        boxShadow: '0 0 12px rgba(0,160,255,0.5)',
                        width: `${completionRate}%`, transition: 'width 0.7s ease',
                      }} />
                    </div>
                  </PanelCard>

                  <PanelCard title="Focus Sessions">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Total sessions',      value: analytics.completedSessions },
                        { label: 'Total minutes',       value: `${analytics.totalFocusMinutes} min` },
                        { label: 'Avg session length',  value: analytics.averageSessionLength > 0 ? `${analytics.averageSessionLength} min` : '—' },
                        { label: 'Total hours focused', value: `${(analytics.totalFocusMinutes / 60).toFixed(1)} hrs` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)' }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </PanelCard>
                </div>

                {/* ── Pro/Team Advanced Section ── */}
                {!canUsePro ? (
                  <>
                    <LockedProCard
                      title="Weekly AI Review"
                      description="Get a structured weekly execution review: completed work, unfinished priorities, focus consistency, execution score, and suggested next steps."
                    />
                    <LockedProCard
                      title="Export Summary"
                      description="Generate a clean Markdown productivity summary you can copy to Notion, Obsidian, or your notes app."
                    />
                    <div style={{
                      ...panel, marginBottom: 20, padding: '20px 24px',
                      borderColor: 'rgba(80,60,160,0.2)', background: 'rgba(3, 5, 16, 0.6)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Sparkles size={14} style={{ color: 'rgba(130,100,220,0.7)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(140,120,220,0.8)' }}>Advanced Analytics</span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99,
                          background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
                          color: '#a78bfa', fontWeight: 700,
                        }}>PRO</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(80,110,160,0.7)', marginBottom: 14 }}>
                        Unlock execution score, focus consistency index, productivity rating, and advanced trend analysis.
                      </p>
                      <Link href="/pricing" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
                        color: '#a78bfa', textDecoration: 'none',
                      }}>
                        <Sparkles size={11} />Upgrade to Pro
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Advanced Analytics Cards */}
                    <div style={{ display: 'grid', gap: 20, marginBottom: 20 }} className="md:grid-cols-3">
                      <PanelCard title="Execution Score">
                        <div style={{ textAlign: 'center', paddingTop: 8 }}>
                          <div style={{
                            fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em',
                            color: completionRate >= 70 ? '#22c55e' : completionRate >= 40 ? '#ffb700' : '#ef4444',
                          }}>
                            {Math.round((completionRate * 0.5) + (analytics.completedSessions > 0 ? 30 : 0) + (analytics.brainDumpsOrganized > 0 ? 20 : 0))}
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(80,120,160,0.7)', marginTop: 4 }}>out of 100</p>
                          <div style={{ marginTop: 12, height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 99,
                              background: completionRate >= 70 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : completionRate >= 40 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)',
                              width: `${Math.min(Math.round((completionRate * 0.5) + (analytics.completedSessions > 0 ? 30 : 0) + (analytics.brainDumpsOrganized > 0 ? 20 : 0)), 100)}%`,
                            }} />
                          </div>
                        </div>
                      </PanelCard>

                      <PanelCard title="Focus Consistency">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                          {[
                            { label: 'Sessions completed', value: String(analytics.completedSessions) },
                            { label: 'Hours focused', value: `${(analytics.totalFocusMinutes / 60).toFixed(1)}h` },
                            { label: 'Avg session', value: analytics.averageSessionLength > 0 ? `${analytics.averageSessionLength}m` : '—' },
                            { label: 'Brain dumps', value: String(analytics.brainDumpsOrganized) },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)' }}>{label}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(180,210,240,0.9)' }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </PanelCard>

                      <PanelCard title="Productivity Index">
                        <div style={{ textAlign: 'center', paddingTop: 8 }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                            {Array.from({ length: 5 }, (_, i) => {
                              const score = Math.round((completionRate * 0.5) + (analytics.completedSessions > 0 ? 30 : 0) + (analytics.brainDumpsOrganized > 0 ? 20 : 0));
                              const filled = i < Math.ceil(score / 20);
                              return (
                                <div key={i} style={{
                                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                  background: filled ? 'rgba(0,130,255,0.2)' : 'rgba(0,0,0,0.3)',
                                  border: `1px solid ${filled ? 'rgba(0,160,255,0.35)' : 'rgba(0,160,255,0.08)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {filled && <Sparkles size={12} style={{ color: '#40b8ff' }} />}
                                </div>
                              );
                            })}
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(80,120,160,0.7)' }}>
                            {completionRate >= 70 ? 'High performer' : completionRate >= 40 ? 'Building momentum' : 'Getting started'}
                          </p>
                        </div>
                      </PanelCard>
                    </div>

                    {/* Weekly AI Review */}
                    <div style={{ ...panel, borderLeft: '3px solid rgba(124,58,237,0.5)', marginBottom: 20 }}>
                      <div style={{
                        padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RefreshCw size={15} style={{ color: '#a78bfa' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Weekly AI Review</span>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.2)', color: '#a78bfa', fontWeight: 700 }}>PRO</span>
                        </div>
                        {!weeklyReview && (
                          <Button size="sm" onClick={handleWeeklyReview} loading={reviewLoading}>
                            <Sparkles size={12} /> Generate
                          </Button>
                        )}
                        {weeklyReview && (
                          <button onClick={() => setWeeklyReview(null)} style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Regenerate
                          </button>
                        )}
                      </div>
                      <div style={{ padding: '16px 20px 20px' }}>
                        {reviewError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{reviewError}</p>}
                        {!weeklyReview ? (
                          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                            Generate your structured weekly execution review — completed work, unfinished priorities, focus patterns, and AI-suggested next steps.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.7 }}>{weeklyReview.summary}</p>

                            <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2">
                              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Completed This Week</p>
                                {weeklyReview.completedWork.length > 0 ? weeklyReview.completedWork.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
                                    <CheckCircle2 size={12} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{item}</span>
                                  </div>
                                )) : <span style={{ fontSize: 12, color: 'rgba(90,120,160,0.6)' }}>No completions recorded this week</span>}
                              </div>
                              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,185,0,0.05)', border: '1px solid rgba(255,185,0,0.15)' }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#ffb700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Unfinished Priorities</p>
                                {weeklyReview.unfinishedPriorities.length > 0 ? weeklyReview.unfinishedPriorities.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 5 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffb700', marginTop: 5, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{item}</span>
                                  </div>
                                )) : <span style={{ fontSize: 12, color: 'rgba(90,120,160,0.6)' }}>All priorities addressed</span>}
                              </div>
                            </div>

                            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,160,255,0.12)' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#40b8ff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Focus Consistency</p>
                              <p style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{weeklyReview.focusConsistency}</p>
                            </div>

                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(90,120,160,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Suggested Next Steps</p>
                              {weeklyReview.suggestedNextSteps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)', borderRadius: 5, padding: '1px 5px', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                  <span style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>{step}</span>
                                </div>
                              ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 11, color: 'rgba(90,120,160,0.6)' }}>Execution Score:</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: weeklyReview.executionScore >= 70 ? '#22c55e' : weeklyReview.executionScore >= 40 ? '#ffb700' : '#ef4444' }}>
                                {weeklyReview.executionScore}/100
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Export Summary */}
                    <div style={{ ...panel, borderLeft: '3px solid rgba(0,160,255,0.5)', marginBottom: 20 }}>
                      <div style={{
                        padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={15} style={{ color: '#40b8ff' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Export Summary</span>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.2)', color: '#a78bfa', fontWeight: 700 }}>PRO</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {exportData && (
                            <button
                              onClick={handleCopy}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                                padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                                background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(0,100,200,0.1)',
                                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(0,160,255,0.2)'}`,
                                color: copied ? '#22c55e' : '#40b8ff',
                              }}
                            >
                              {copied ? <Check size={12} /> : <Copy size={12} />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                          {!exportData ? (
                            <Button size="sm" onClick={handleExportSummary} loading={exportLoading}>
                              <FileText size={12} /> Generate
                            </Button>
                          ) : (
                            <button onClick={() => setExportData(null)} style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              Regenerate
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '16px 20px 20px' }}>
                        {exportError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{exportError}</p>}
                        {!exportData ? (
                          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                            Generate a clean Markdown productivity summary — copy it directly to Notion, Obsidian, or any notes app.
                          </p>
                        ) : (
                          <pre style={{
                            fontSize: 12, color: 'rgba(160,200,240,0.85)', lineHeight: 1.7,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.1)',
                            borderRadius: 8, padding: '14px 16px', maxHeight: 400, overflowY: 'auto',
                            fontFamily: 'ui-monospace, monospace',
                          }}>
                            {exportData.markdown}
                          </pre>
                        )}
                      </div>
                    </div>

                    {/* Team Analytics panel for Team plan */}
                    {isTeam && (
                      <div style={{ ...panel, marginBottom: 20, padding: '20px 24px', borderColor: 'rgba(120,80,200,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Team Analytics</span>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 99,
                            background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
                            color: '#a78bfa', fontWeight: 700,
                          }}>TEAM</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.7)', marginBottom: 12 }}>
                          Full team performance analytics, shared task tracking, team velocity, and weekly execution reports are in the Team workspace.
                        </p>
                        <Link href="/team" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.2)',
                          color: '#a78bfa', textDecoration: 'none',
                        }}>
                          Open Team Workspace →
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {/* AI Evening Summary */}
                <div style={{ ...panel, borderLeft: '3px solid rgba(0,160,255,0.5)', marginBottom: 20 }}>
                  <div style={{
                    padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Moon size={15} style={{ color: '#8080ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>AI Evening Summary</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#40b8ff' }}>
                        <Sparkles size={11} /> MindPad AI
                      </div>
                    </div>
                    {!eveningSummary && (
                      <Button size="sm" onClick={handleEveningSummary} loading={summaryLoading}>
                        <Sparkles size={12} /> Generate
                      </Button>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {eveningSummary ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.7 }}>
                          {eveningSummary.summary}
                        </p>
                        {eveningSummary.accomplishments.length > 0 && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(90,120,160,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Today's Wins</p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {eveningSummary.accomplishments.map((a, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>
                                  <CheckCircle2 size={13} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {eveningSummary.unfinished.length > 0 && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(90,120,160,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Carry Forward</p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {eveningSummary.unfinished.map((a, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(150,180,220,0.75)' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,160,255,0.4)', flexShrink: 0, marginTop: 5 }} />{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ display: 'grid', gap: 10 }} className="md:grid-cols-2">
                          {eveningSummary.tomorrowPriority && (
                            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(255,185,0,0.06)', border: '1px solid rgba(255,185,0,0.18)' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#ffb700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Tomorrow's #1</p>
                              <p style={{ fontSize: 12, color: 'rgba(200,220,245,0.88)' }}>{eveningSummary.tomorrowPriority}</p>
                            </div>
                          )}
                          {eveningSummary.improvement && (
                            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,160,255,0.12)' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#40b8ff', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Improve Tomorrow</p>
                              <p style={{ fontSize: 12, color: 'rgba(180,210,240,0.85)' }}>{eveningSummary.improvement}</p>
                            </div>
                          )}
                        </div>
                        <button onClick={() => setEveningSummary(null)} style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                          Regenerate
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                        Generate a personalized end-of-day summary with wins, unfinished work, and tomorrow's priority.
                      </p>
                    )}
                  </div>
                </div>

                {/* Insights */}
                {analytics.totalTasks > 0 && (
                  <div style={{
                    padding: '20px', borderRadius: '1rem',
                    background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,160,255,0.15)',
                  }}>
                    <h2 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)', marginBottom: 14 }}>Insights</h2>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {completionRate === 100 && (
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(130,170,210,0.85)' }}>
                          <Badge variant="success">100%</Badge>
                          All tasks completed — great execution!
                        </li>
                      )}
                      {completionRate < 50 && analytics.totalTasks > 3 && (
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(130,170,210,0.85)' }}>
                          <Badge variant="warning">Tip</Badge>
                          Less than half your tasks are done — try a focus session.
                        </li>
                      )}
                      {analytics.totalFocusMinutes >= 300 && (
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(130,170,210,0.85)' }}>
                          <Badge variant="info">Focus</Badge>
                          {Math.round(analytics.totalFocusMinutes / 60)} hours of deep work logged.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
