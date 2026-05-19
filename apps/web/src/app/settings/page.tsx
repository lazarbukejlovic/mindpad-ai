'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Download, LogOut, Bot, Sparkles, Brain } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken, removeToken } from '@/lib/auth';
import AppNav from '@/components/layout/AppNav';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import DarkModeToggle from '@/components/layout/DarkModeToggle';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportMsg, setExportMsg] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('25');

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    ApiClient.getMe()
      .then((d) => setEmail(d.email))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  function handleExport() {
    setExportMsg('Data export is available in the full release. Your data is securely stored.');
    setTimeout(() => setExportMsg(''), 4000);
  }

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page">
        <AppNav />
        <div className="md:pl-60 flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <Settings size={20} className="text-brand-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--text))]">Settings</h1>
                <p className="text-sm text-[rgb(var(--text-muted))]">
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* Profile */}
            <Card title="Account" className="mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                >
                  {email ? email[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[rgb(var(--text))] truncate">{email}</p>
                  <Badge variant="success" className="mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Preferences */}
            <Card title="Preferences" className="mb-4">
              <div className="space-y-4">
                {/* Dark mode */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text))]">Dark Mode</p>
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                      Toggle between light and dark theme
                    </p>
                  </div>
                  <DarkModeToggle />
                </div>

                {/* Default duration */}
                <div className="flex items-center justify-between py-2 border-t border-[rgb(var(--border))]">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text))]">
                      Default Focus Duration
                    </p>
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                      Starting duration for new Pomodoro sessions
                    </p>
                  </div>
                  <select
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm text-[rgb(var(--text))] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="25">25 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* AI preferences */}
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-brand-500" />
                  <h2 className="text-sm font-semibold text-[rgb(var(--text))]">AI Preferences</h2>
                </div>
                <Badge variant="info">Gemini AI</Badge>
              </div>
              <p className="text-xs text-[rgb(var(--text-muted))] mb-4">
                Powered by Google Gemini. Extended configuration coming in a future update.
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: Brain,
                    label: 'Auto-organize brain dumps',
                    sub: 'Extract tasks when you save a dump',
                    enabled: true,
                  },
                  {
                    icon: Sparkles,
                    label: 'Smart task prioritization',
                    sub: 'AI suggests priority levels based on context',
                    enabled: true,
                  },
                  {
                    icon: Sparkles,
                    label: 'Daily briefs',
                    sub: 'Morning and evening AI summaries',
                    enabled: true,
                  },
                ].map(({ icon: Icon, label, sub, enabled }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={15} className="text-[rgb(var(--text-muted))] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--text))]">{label}</p>
                        <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{sub}</p>
                      </div>
                    </div>
                    <div
                      className="w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 ml-4 cursor-default"
                      style={{
                        backgroundColor: enabled ? 'rgb(var(--brand))' : 'rgb(var(--border))',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Data export */}
            <Card title="Data & Export" className="mb-4">
              <p className="text-sm text-[rgb(var(--text-muted))] mb-4">
                Export all your brain dumps, tasks, and focus sessions as JSON. Your data belongs to you.
              </p>
              <Button variant="ghost" onClick={handleExport}>
                <Download size={15} />
                Export My Data
              </Button>
              {exportMsg && (
                <p
                  className="mt-3 text-sm rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: 'rgb(var(--brand) / 0.08)',
                    borderLeft: '3px solid rgb(var(--brand))',
                    color: 'rgb(var(--text))',
                  }}
                >
                  {exportMsg}
                </p>
              )}
            </Card>

            {/* Danger zone */}
            <div className="card p-5 border-red-200 dark:border-red-900">
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                Danger Zone
              </h2>
              <p className="text-sm text-[rgb(var(--text-muted))] mb-4">
                Signing out will clear your local session. Your data is safely stored.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign Out
                </Button>
                <Button variant="ghost" disabled>
                  Delete Account
                  <Badge variant="default" className="ml-1">Coming soon</Badge>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
