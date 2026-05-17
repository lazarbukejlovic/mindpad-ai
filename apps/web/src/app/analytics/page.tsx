'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { AnalyticsSummary } from '@/types/index';

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadAnalytics();
  }, [router]);

  async function loadAnalytics() {
    try {
      const data = await ApiClient.getAnalyticsSummary();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
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
          <Link
            href="/dashboard"
            className="text-xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] bg-clip-text text-transparent"
          >
            MindPad
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your productivity and progress.</p>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <MetricCard
                title="Tasks Completed"
                value={analytics.completedTasks}
                total={analytics.totalTasks}
                color="blue"
                icon="✅"
              />
              <MetricCard
                title="Focus Minutes"
                value={analytics.totalFocusMinutes}
                color="purple"
                icon="⏱️"
                suffix="min"
              />
              <MetricCard
                title="Brain Dumps Organized"
                value={analytics.brainDumpsOrganized}
                color="green"
                icon="🧠"
              />
              <MetricCard
                title="Weekly Streak"
                value={analytics.weeklyStreak}
                color="amber"
                icon="🔥"
                suffix="days"
              />
            </div>

            {/* Detailed Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-8">
                Detailed Breakdown
              </h2>

              <div className="space-y-6">
                <StatRow
                  label="Total Tasks Created"
                  value={analytics.totalTasks}
                  color="blue"
                />
                <StatRow
                  label="Task Completion Rate"
                  value={`${analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}%`}
                  color="green"
                />
                <StatRow
                  label="Average Session Length"
                  value={`${analytics.averageSessionLength} min`}
                  color="purple"
                />
                <StatRow
                  label="Focus Sessions"
                  value={analytics.completedSessions}
                  color="amber"
                />
              </div>
            </div>

            {/* Insights */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200/50">
              <h2 className="text-xl font-bold text-blue-900 mb-6">
                📊 Your Insights
              </h2>

              <div className="space-y-3 text-blue-900">
                {analytics.totalTasks > 10 && (
                  <p>
                    💡 You're very productive! You've created{' '}
                    {analytics.totalTasks} tasks.
                  </p>
                )}
                {analytics.completedTasks === analytics.totalTasks && analytics.totalTasks > 0 && (
                  <p>🎯 Impressive! You've completed all your tasks.</p>
                )}
                {analytics.totalFocusMinutes > 300 && (
                  <p>
                    ⏱️ You've spent {analytics.totalFocusMinutes} minutes in
                    focused work. Keep it up!
                  </p>
                )}
                {analytics.weeklyStreak >= 5 && (
                  <p>
                    🔥 Amazing streak! You've been consistent for{' '}
                    {analytics.weeklyStreak} days.
                  </p>
                )}
                {analytics.brainDumpsOrganized > 5 && (
                  <p>
                    🧠 You've organized {analytics.brainDumpsOrganized} brain
                    dumps. Clarity is power!
                  </p>
                )}
                {analytics.totalTasks === 0 && (
                  <p>
                    ✨ Get started by creating your first task via brain dump.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  total,
  color,
  icon,
  suffix,
}: {
  title: string;
  value: number;
  total?: number;
  color: 'blue' | 'purple' | 'green' | 'amber';
  icon: string;
  suffix?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
  };

  return (
    <div className={`rounded-xl p-6 border border-${color}-200/50 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold">
        {value}
        {suffix && <span className="text-lg ml-2">{suffix}</span>}
      </p>
      {total && (
        <p className="text-sm mt-2 opacity-75">of {total} total</p>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    amber: 'bg-amber-100',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
      <p className="font-medium text-slate-700">{label}</p>
      <span className={`px-4 py-2 rounded-lg font-bold ${colorClasses[color]}`}>
        {value}
      </span>
    </div>
  );
}
