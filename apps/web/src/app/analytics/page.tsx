'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Percent,
  Bot,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import KPICard from '@/components/ui/KPICard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

function simulateWeeklyData(
  totalCompleted: number,
  totalMinutes: number
): Array<{ day: string; tasks: number; minutes: number }> {
  const weights = [0.08, 0.12, 0.18, 0.22, 0.17, 0.14, 0.09];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    tasks:   Math.round(totalCompleted * weights[i]),
    minutes: Math.round(totalMinutes * weights[i]),
  }));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [eveningSummary, setEveningSummary] = useState<{
    summary: string;
    accomplishments: string[];
    lessonsLearned: string[];
    tomorrowPreview: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    ApiClient.getAnalyticsSummary()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  async function handleEveningSummary() {
    if (!analytics) return;
    setSummaryLoading(true);
    try {
      const accomplishments = [
        analytics.completedTasks > 0 ? `Completed ${analytics.completedTasks} tasks` : '',
        analytics.completedSessions > 0
          ? `Finished ${analytics.completedSessions} focus sessions (${analytics.totalFocusMinutes} min)`
          : '',
        analytics.brainDumpsOrganized > 0
          ? `Organized ${analytics.brainDumpsOrganized} brain dumps with AI`
          : '',
      ].filter(Boolean);

      const result = await ApiClient.getEveningSummary(accomplishments);
      setEveningSummary(result);
    } catch {
      setEveningSummary({
        summary: 'Could not generate summary. Make sure the API is running.',
        accomplishments: [],
        lessonsLearned: [],
        tomorrowPreview: '',
      });
    } finally {
      setSummaryLoading(false);
    }
  }

  const completionRate =
    analytics && analytics.totalTasks > 0
      ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
      : 0;

  const weeklyData = analytics
    ? simulateWeeklyData(analytics.completedTasks, analytics.totalFocusMinutes)
    : [];

  const chartTooltipStyle = {
    backgroundColor: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--border))',
    borderRadius: '8px',
    color: 'rgb(var(--text))',
    fontSize: '12px',
  };

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <BarChart3 size={20} className="text-brand-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[rgb(var(--text))]">Analytics</h1>
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    Your productivity at a glance
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : !analytics ? (
              <div className="text-center py-16 text-[rgb(var(--text-muted))]">
                Could not load analytics.
              </div>
            ) : (
              <>
                {/* Streak banner */}
                {analytics.weeklyStreak >= 3 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 mb-6">
                    <Flame size={20} className="text-amber-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {analytics.weeklyStreak}-day streak — keep the momentum going!
                    </p>
                  </div>
                )}

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KPICard
                    label="Total Tasks"
                    value={analytics.totalTasks}
                    sub={`${analytics.completedTasks} done`}
                    icon={ListTodo}
                    iconClassName="text-brand-500"
                  />
                  <KPICard
                    label="Completed"
                    value={analytics.completedTasks}
                    sub="all time"
                    icon={CheckCircle2}
                    iconClassName="text-emerald-500"
                  />
                  <KPICard
                    label="Completion"
                    value={`${completionRate}%`}
                    sub="rate"
                    icon={Percent}
                    iconClassName="text-violet-500"
                  />
                  <KPICard
                    label="Focus Time"
                    value={analytics.totalFocusMinutes}
                    sub={`${analytics.completedSessions} sessions`}
                    icon={Clock}
                    iconClassName="text-amber-500"
                  />
                </div>

                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <Card title="Completed Tasks (7-day dist.)">
                    {analytics.completedTasks === 0 ? (
                      <div className="h-40 flex items-center justify-center text-sm text-[rgb(var(--text-muted))]">
                        Complete some tasks to see the chart
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgb(var(--border))"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgb(var(--surface-2))' }} />
                          <Bar
                            dataKey="tasks"
                            name="Tasks"
                            fill="rgb(var(--brand))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Card>

                  <Card title="Focus Minutes (7-day dist.)">
                    {analytics.totalFocusMinutes === 0 ? (
                      <div className="h-40 flex items-center justify-center text-sm text-[rgb(var(--text-muted))]">
                        Run some focus sessions to see the chart
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgb(var(--border))"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="minutes"
                            name="Minutes"
                            stroke="rgb(var(--brand))"
                            strokeWidth={2}
                            dot={{ r: 3, fill: 'rgb(var(--brand))' }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Card>
                </div>

                {/* Completion + sessions */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <Card title="Task Completion Rate">
                    <div className="flex items-end gap-3 mb-3">
                      <span className="text-4xl font-bold text-[rgb(var(--text))]">
                        {completionRate}%
                      </span>
                      <span className="text-sm text-[rgb(var(--text-muted))] pb-1">
                        {analytics.completedTasks}/{analytics.totalTasks} tasks
                      </span>
                    </div>
                    <div className="h-2.5 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </Card>

                  <Card title="Focus Sessions">
                    <div className="space-y-3">
                      {[
                        { label: 'Total sessions',    value: analytics.completedSessions },
                        { label: 'Total minutes',     value: `${analytics.totalFocusMinutes} min` },
                        {
                          label: 'Avg session length',
                          value: analytics.averageSessionLength > 0
                            ? `${analytics.averageSessionLength} min`
                            : '—',
                        },
                        {
                          label: 'Total hours focused',
                          value: `${(analytics.totalFocusMinutes / 60).toFixed(1)} hrs`,
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-sm text-[rgb(var(--text-muted))]">{label}</span>
                          <span className="text-sm font-semibold text-[rgb(var(--text))]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* AI Evening Summary */}
                <div
                  className="card p-5"
                  style={{ borderLeft: '3px solid rgb(var(--brand))' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-violet-500" />
                      <h2 className="text-sm font-semibold text-[rgb(var(--text))]">
                        AI Evening Summary
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-brand-500">
                        <Bot size={12} />
                        Gemini
                      </div>
                    </div>
                    {!eveningSummary && (
                      <Button size="sm" onClick={handleEveningSummary} loading={summaryLoading}>
                        <Sparkles size={13} />
                        Generate
                      </Button>
                    )}
                  </div>

                  {eveningSummary ? (
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-sm text-[rgb(var(--text))] leading-relaxed">
                        {eveningSummary.summary}
                      </p>
                      {eveningSummary.accomplishments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide mb-2">
                            Accomplishments
                          </p>
                          <ul className="space-y-1">
                            {eveningSummary.accomplishments.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--text))]">
                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {eveningSummary.tomorrowPreview && (
                        <div className="p-3 bg-[rgb(var(--surface-2))] rounded-lg">
                          <p className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide mb-1">
                            Tomorrow
                          </p>
                          <p className="text-sm text-[rgb(var(--text))]">
                            {eveningSummary.tomorrowPreview}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      Generate a personalized end-of-day summary based on your progress.
                    </p>
                  )}
                </div>

                {/* Insights */}
                {analytics.totalTasks > 0 && (
                  <div className="mt-6 p-5 rounded-xl border border-brand-500/20 bg-brand-500/5">
                    <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-3">Insights</h2>
                    <ul className="space-y-2 text-sm text-[rgb(var(--text-muted))]">
                      {completionRate === 100 && (
                        <li className="flex items-center gap-2">
                          <Badge variant="success">100%</Badge>
                          All tasks completed — great execution!
                        </li>
                      )}
                      {completionRate < 50 && analytics.totalTasks > 3 && (
                        <li className="flex items-center gap-2">
                          <Badge variant="warning">Tip</Badge>
                          Less than half your tasks are done — try a focus session.
                        </li>
                      )}
                      {analytics.totalFocusMinutes >= 300 && (
                        <li className="flex items-center gap-2">
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
