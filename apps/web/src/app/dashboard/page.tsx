'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken, removeToken } from '@/lib/auth';
import {
  AnalyticsSummary,
  MorningBrief,
  Task,
} from '@/types/index';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [briefData, tasksData, analyticsData] = await Promise.all([
        ApiClient.getMorningBrief(),
        ApiClient.getTasks(),
        ApiClient.getAnalyticsSummary(),
      ]);
      setMorningBrief(briefData);
      setTasks((tasksData as Task[]).filter((t) => !t.completed).slice(0, 5));
      setAnalytics(analyticsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f3f0] to-[#f0ede9] flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f3f0] to-[#f0ede9]">
      {/* Header */}
      <nav className="bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] bg-clip-text text-transparent">
            MindPad
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <Link
            href="/brain-dump"
            className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Brain Dump
          </Link>
          <Link
            href="/focus"
            className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Focus Session
          </Link>
          <Link
            href="/analytics"
            className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Morning Brief */}
        {morningBrief && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200/50 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  ☀️ Good Morning
                </h2>
                <p className="text-blue-800">{morningBrief.briefText}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Top Priority
                </p>
                <p className="text-slate-900 font-semibold">
                  {morningBrief.topPriority}
                </p>
              </div>
              <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Suggested Focus Time
                </p>
                <p className="text-slate-900 font-semibold">
                  {morningBrief.suggestedFocusTime} minutes
                </p>
              </div>
              <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-600 mb-2">
                  Key Themes
                </p>
                <p className="text-slate-900 font-semibold text-sm">
                  {morningBrief.keyThemesText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {analytics && (
          <div className="mb-8 grid md:grid-cols-4 gap-4">
            <StatCard
              label="Tasks Today"
              value={analytics.completedTasks}
              total={analytics.totalTasks}
            />
            <StatCard
              label="Focus Minutes"
              value={analytics.totalFocusMinutes}
              suffix="min"
            />
            <StatCard
              label="Organized"
              value={analytics.brainDumpsOrganized}
            />
            <StatCard
              label="Streak"
              value={analytics.weeklyStreak}
              suffix="days"
            />
          </div>
        )}

        {/* Today's Tasks */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Today's Tasks</h3>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200/50 flex items-start gap-4"
                >
                  <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-8">
              No tasks yet. Start by{' '}
              <Link href="/brain-dump" className="text-blue-600 hover:underline">
                brain dumping
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  suffix,
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-slate-200/50 text-center">
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">
        {value}
        {suffix && <span className="text-lg ml-1">{suffix}</span>}
      </p>
      {total && (
        <p className="text-xs text-slate-500 mt-2">of {total} total</p>
      )}
    </div>
  );
}
