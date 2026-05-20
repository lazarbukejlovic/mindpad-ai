'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, CheckCircle2, Clock, Flame, ListTodo, Percent, Moon, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary } from '@/types/index';
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

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics]         = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [eveningSummary, setEveningSummary] = useState<{
    summary: string; accomplishments: string[]; lessonsLearned: string[]; tomorrowPreview: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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
      setEveningSummary({ summary: 'Could not generate summary. Make sure the API is running.', accomplishments: [], lessonsLearned: [], tomorrowPreview: '' });
    } finally {
      setSummaryLoading(false);
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
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>
            ) : !analytics ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(90,120,160,0.7)' }}>
                Could not load analytics.
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.7 }}>
                          {eveningSummary.summary}
                        </p>
                        {eveningSummary.accomplishments.length > 0 && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(90,120,160,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                              Accomplishments
                            </p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {eveningSummary.accomplishments.map((a, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>
                                  <CheckCircle2 size={13} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {eveningSummary.tomorrowPreview && (
                          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.1)' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(90,120,160,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tomorrow</p>
                            <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>{eveningSummary.tomorrowPreview}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                        Generate a personalized end-of-day summary based on your progress.
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
