'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTodo,
  CheckCircle2,
  CalendarDays,
  Clock,
  Bot,
  Sparkles,
  Brain,
  Timer,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary, Task, BrainDump } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import KPICard from '@/components/ui/KPICard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const priorityVariant = {
  high:   'danger',
  medium: 'warning',
  low:    'success',
} as const;

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [brief, setBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) { setLoading(false); router.push('/login'); return; }
    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [tasksData, analyticsData, brainDumpsData, meData] = await Promise.all([
        ApiClient.getTasks(),
        ApiClient.getAnalyticsSummary(),
        ApiClient.getBrainDumps(),
        ApiClient.getMe(),
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
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (updated as Task) : t)));
    } catch { /* silent */ }
  }

  async function handleGenerateBrief() {
    setBriefLoading(true);
    try {
      const activeTitles = activeTasks.slice(0, 5).map((t) => t.title).join(', ');
      const result = await ApiClient.getMorningBrief(activeTitles);
      setBrief(result.briefText);
    } catch {
      setBrief('Could not generate brief. Make sure the API is running.');
    } finally {
      setBriefLoading(false);
    }
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedToday = tasks.filter(
    (t) => t.completed && new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length;
  const displayName = userEmail ? userEmail.split('@')[0] : '';
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[rgb(var(--text))]">
                {getGreeting()}{displayName ? `, ${displayName}` : ''}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-[rgb(var(--text-muted))]">{dateLabel}</p>
                {analytics && analytics.weeklyStreak >= 3 && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Flame size={13} />
                    {analytics.weeklyStreak}-day streak
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KPICard
                    label="Total Tasks"
                    value={tasks.length}
                    sub={`${activeTasks.length} active`}
                    icon={ListTodo}
                    iconClassName="text-brand-500"
                  />
                  <KPICard
                    label="Completed"
                    value={analytics?.completedTasks ?? 0}
                    sub="all time"
                    icon={CheckCircle2}
                    iconClassName="text-emerald-500"
                  />
                  <KPICard
                    label="Today"
                    value={completedToday}
                    sub="tasks done"
                    icon={CalendarDays}
                    iconClassName="text-violet-500"
                  />
                  <KPICard
                    label="Focus Time"
                    value={analytics?.totalFocusMinutes ?? 0}
                    sub="total minutes"
                    icon={Clock}
                    iconClassName="text-amber-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Active tasks + Morning Brief */}
                  <div className="md:col-span-2 space-y-4">
                    {/* AI Morning Brief */}
                    <Card
                      title="AI Morning Brief"
                      action={
                        <div className="flex items-center gap-1.5 text-xs text-brand-500 font-medium">
                          <Bot size={14} />
                          Gemini AI
                        </div>
                      }
                    >
                      {!brief ? (
                        <div className="flex flex-col items-start gap-3">
                          <p className="text-sm text-[rgb(var(--text-muted))]">
                            Generate a personalized brief based on your active tasks.
                          </p>
                          <Button
                            size="sm"
                            onClick={handleGenerateBrief}
                            loading={briefLoading}
                          >
                            <Sparkles size={14} />
                            Generate Brief
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-l-4 pl-4 py-1 text-sm text-[rgb(var(--text))] leading-relaxed"
                          style={{ borderColor: 'rgb(var(--brand))' }}
                        >
                          {brief}
                        </div>
                      )}
                    </Card>

                    {/* Today's focus tasks */}
                    <Card
                      title="Today's Focus"
                      action={
                        <Link
                          href="/tasks"
                          className="text-xs text-brand-500 font-medium hover:underline flex items-center gap-1"
                        >
                          View all <ArrowRight size={12} />
                        </Link>
                      }
                    >
                      {activeTasks.length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle2 size={28} className="mx-auto mb-2 text-[rgb(var(--border))]" />
                          <p className="text-sm text-[rgb(var(--text-muted))]">No active tasks</p>
                          <Link
                            href="/brain-dump"
                            className="text-xs text-brand-500 hover:underline mt-1 inline-block"
                          >
                            Extract tasks from a brain dump
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {activeTasks.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors group"
                            >
                              <button
                                onClick={() => handleToggleTask(task)}
                                className="w-5 h-5 rounded border-2 border-[rgb(var(--border))] hover:border-brand-500 flex items-center justify-center transition-colors flex-shrink-0"
                              />
                              <p className="flex-1 text-sm text-[rgb(var(--text))] truncate">
                                {task.title}
                              </p>
                              <Badge variant={priorityVariant[task.priority]}>
                                {task.priority}
                              </Badge>
                            </div>
                          ))}
                          {activeTasks.length > 5 && (
                            <Link
                              href="/tasks"
                              className="block text-center text-xs text-[rgb(var(--text-muted))] hover:text-brand-500 pt-2 transition-colors"
                            >
                              +{activeTasks.length - 5} more tasks
                            </Link>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4">
                    {/* Quick actions */}
                    <Card title="Quick Actions">
                      <div className="space-y-1.5">
                        {[
                          { href: '/brain-dump', icon: Brain,  label: 'New Brain Dump', primary: true },
                          { href: '/focus',      icon: Timer,  label: 'Start Focus',    primary: false },
                          { href: '/tasks',      icon: ListTodo, label: 'Manage Tasks', primary: false },
                        ].map(({ href, icon: Icon, label, primary }) => (
                          <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              primary
                                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/15'
                                : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]'
                            }`}
                          >
                            <Icon size={16} />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </Card>

                    {/* Recent notes */}
                    <Card
                      title="Recent Notes"
                      action={
                        <Link
                          href="/brain-dump"
                          className="text-xs text-brand-500 font-medium hover:underline"
                        >
                          All →
                        </Link>
                      }
                    >
                      {brainDumps.length === 0 ? (
                        <p className="text-xs text-[rgb(var(--text-muted))] text-center py-4">
                          No notes yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {brainDumps.map((dump) => (
                            <div
                              key={dump.id}
                              className="p-2.5 bg-[rgb(var(--surface-2))] rounded-lg"
                            >
                              <p className="text-[10px] text-[rgb(var(--text-muted))] mb-1">
                                {new Date(dump.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-xs text-[rgb(var(--text))] line-clamp-2 leading-relaxed">
                                {dump.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Progress */}
                    {analytics && analytics.totalTasks > 0 && (
                      <Card title="Overall Progress">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-[rgb(var(--text))]">
                            {Math.round(
                              (analytics.completedTasks / analytics.totalTasks) * 100
                            )}%
                          </span>
                          <span className="text-xs text-[rgb(var(--text-muted))]">
                            {analytics.completedTasks}/{analytics.totalTasks}
                          </span>
                        </div>
                        <div className="h-2 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all duration-700"
                            style={{
                              width: `${Math.round(
                                (analytics.completedTasks / analytics.totalTasks) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </Card>
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
