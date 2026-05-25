'use client';

import { useEffect, useLayoutEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ListTodo, CheckCircle2, CalendarDays, Clock,
  Sparkles, Brain, Timer, ArrowRight, Flame, Zap,
  Send, MessageSquare, ChevronRight, Users,
} from 'lucide-react';
import { ApiClient } from '@/services/api';
import { saveToken } from '@/lib/auth';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { AnalyticsSummary, Task, BrainDump, AskResult, MorningBrief, OnboardingStatus, TeamWorkspaceState } from '@/types/index';
import { buildWorkspaceContext } from '@/lib/aiContext';
import AppNav from '@/components/layout/AppNav';
import KPICard from '@/components/ui/KPICard';
import VerificationBanner from '@/components/ui/VerificationBanner';
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

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 160, 255, 0.12)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

function PanelCard({ title, action, children, badge }: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div style={panel}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{title}</span>
            {badge}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: title ? '16px 20px 20px' : '20px' }}>
        {children}
      </div>
    </div>
  );
}

function OnboardingChecklist({ onboarding }: { onboarding: OnboardingStatus }) {
  const steps = [
    { label: 'Choose your goal',           done: !!onboarding.onboardingGoal,         href: '/onboarding' },
    { label: 'Add your first brain dump',  done: onboarding.firstBrainDumpCompleted,  href: '/brain-dump' },
    { label: 'Extract first tasks',        done: onboarding.firstTasksExtracted,      href: '/brain-dump' },
    { label: 'Start first focus session',  done: onboarding.firstFocusStarted,        href: '/focus' },
    { label: 'Review your analytics',      done: false,                               href: '/analytics' },
  ];
  const completedCount = steps.filter(s => s.done).length;

  return (
    <div style={{
      marginBottom: 24, padding: '16px 20px', borderRadius: '1rem',
      background: 'rgba(0,80,180,0.07)', border: '1px solid rgba(0,160,255,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(160,200,240,0.9)' }}>Getting started</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: 'rgba(0,130,255,0.12)', color: '#40b8ff',
            border: '1px solid rgba(0,160,255,0.2)',
          }}>{completedCount}/{steps.length}</span>
        </div>
        <Link href="/onboarding" style={{ fontSize: 11, color: 'rgba(80,120,170,0.7)', textDecoration: 'none' }}>
          Continue setup →
        </Link>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {steps.map((s, i) => (
          <Link key={i} href={s.href} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 99, fontSize: 12, textDecoration: 'none',
            background: s.done ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.2)',
            border: `1px solid ${s.done ? 'rgba(34,197,94,0.25)' : 'rgba(0,160,255,0.12)'}`,
            color: s.done ? 'rgba(100,220,140,0.9)' : 'rgba(110,150,200,0.75)',
          }}>
            {s.done
              ? <CheckCircle2 size={11} style={{ color: '#22c55e' }} />
              : <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(0,160,255,0.4)', display: 'block' }} />}
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  'What should I focus on first?',
  'Create a 3-hour execution plan',
  'Which tasks are vague or unclear?',
  'What is the smallest next step?',
];

export default function DashboardPage() {
  const router = useRouter();
  const { checking } = useSessionRestore();
  const [loading, setLoading]           = useState(true);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [analytics, setAnalytics]       = useState<AnalyticsSummary | null>(null);
  const [brainDumps, setBrainDumps]     = useState<BrainDump[]>([]);
  const [userEmail, setUserEmail]       = useState('');
  const [authProvider, setAuthProvider] = useState('');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [error, setError]               = useState('');
  const [onboarding, setOnboarding]     = useState<OnboardingStatus | null>(null);

  // AI status
  const [aiMode, setAiMode]             = useState<'ai' | 'offline' | null>(null);

  // Morning brief
  const [brief, setBrief]               = useState<MorningBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Ask MindPad AI
  const [question, setQuestion]         = useState('');
  const [askResult, setAskResult]       = useState<AskResult | null>(null);
  const [askLoading, setAskLoading]     = useState(false);
  const [askError, setAskError]         = useState('');

  // Team card (non-blocking, best-effort)
  const [teamState, setTeamState]       = useState<TeamWorkspaceState | null>(null);

  // Capture Google OAuth token synchronously before useSessionRestore's useEffect fires.
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'success') {
      const googleToken = params.get('token');
      if (googleToken) {
        saveToken(googleToken);
        try { window.history.replaceState(null, '', '/dashboard'); } catch {}
        // If a team invite was pending before Google OAuth, redirect back to it.
        try {
          const pendingToken = localStorage.getItem('pending_team_invite_token');
          if (pendingToken) {
            window.location.replace(`/team/invite?token=${pendingToken}`);
            return;
          }
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (checking) return;
    // Check onboarding before loading — redirect new users immediately.
    ApiClient.getOnboardingStatus()
      .then(s => {
        if (!s.onboardingCompleted && !s.hasExistingData) {
          router.replace('/onboarding');
          return;
        }
        setOnboarding(s);
        loadDashboard();
        ApiClient.getAIStatus().then(st => setAiMode(st.mode)).catch(() => setAiMode('offline'));
        ApiClient.getTeamWorkspace().then(ts => { if (ts.exists) setTeamState(ts); }).catch(() => {});
      })
      .catch(() => {
        // If onboarding status unavailable, proceed to dashboard anyway.
        loadDashboard();
        ApiClient.getAIStatus().then(st => setAiMode(st.mode)).catch(() => setAiMode('offline'));
        ApiClient.getTeamWorkspace().then(ts => { if (ts.exists) setTeamState(ts); }).catch(() => {});
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

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
      if (meData.authProvider) setAuthProvider(meData.authProvider);
      setEmailVerified(meData.emailVerified ?? false);
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
      const ctx = buildWorkspaceContext({ tasks, analytics, brainDumps: brainDumps as any });
      const result = await ApiClient.getMorningBrief(ctx);
      setBrief(result);
      setAiMode(result.mode); // sync header badge to actual result mode
    } catch {
      setBrief({
        mainPriority: 'Review your active tasks and pick the most important one',
        topActions: ['Start a brain dump', 'Prioritize your top task', 'Begin a focus session'],
        suggestedFocusBlock: 'Start with a 25-minute focused session',
        warning: '',
        message: 'Clarity beats hustle. Start by picking one thing.',
        mode: 'offline',
      });
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleAsk(e?: FormEvent) {
    e?.preventDefault();
    if (!question.trim()) return;
    setAskError('');
    setAskResult(null);
    setAskLoading(true);
    try {
      const ctx = buildWorkspaceContext({ tasks, analytics, brainDumps: brainDumps as any });
      const result = await ApiClient.askMindPad(question.trim(), ctx);
      setAskResult(result);
      setAiMode(result.mode); // sync header badge to actual result mode
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setAskLoading(false);
    }
  }

  function handleSuggestedQuestion(q: string) {
    setQuestion(q);
    setAskResult(null);
    setAskError('');
  }

  const activeTasks    = tasks.filter(t => !t.completed);
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

            {userEmail && emailVerified === false && authProvider !== 'google' && (
              <VerificationBanner email={userEmail} authProvider={authProvider} emailVerified={emailVerified} />
            )}

            {/* ── Onboarding checklist ── */}
            {onboarding && !onboarding.onboardingCompleted && (
              <OnboardingChecklist onboarding={onboarding} />
            )}

            {/* ── Header ── */}
            <div style={{ marginBottom: 32 }}>
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
                        <Flame size={13} />{analytics.weeklyStreak}-day streak
                      </div>
                    )}
                  </div>
                </div>
                {aiMode !== null && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px', borderRadius: 99, flexShrink: 0,
                    background: aiMode === 'ai' ? 'rgba(0,130,255,0.08)' : 'rgba(60,70,90,0.15)',
                    border: `1px solid ${aiMode === 'ai' ? 'rgba(0,160,255,0.18)' : 'rgba(80,100,140,0.25)'}`,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: aiMode === 'ai' ? '#00c0ff' : 'rgba(120,140,180,0.6)',
                      boxShadow: aiMode === 'ai' ? '0 0 8px rgba(0,200,255,0.9)' : 'none',
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: aiMode === 'ai' ? 'rgba(0,200,255,0.85)' : 'rgba(120,150,190,0.7)',
                    }}>
                      {aiMode === 'ai' ? 'MindPad AI' : 'Execution Assistant'}
                    </span>
                    {aiMode === 'ai' && <Zap size={11} style={{ color: 'rgba(255,185,0,0.8)' }} />}
                  </div>
                )}
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
                  <KPICard label="Completed"    value={analytics?.completedTasks ?? 0}   sub="all time"                       icon={CheckCircle2} accentColor="#22c55e" />
                  <KPICard label="Today"        value={completedToday}                    sub="tasks done"                     icon={CalendarDays} accentColor="#a78bfa" />
                  <KPICard label="Focus Time"   value={analytics?.totalFocusMinutes ?? 0} sub="total minutes"                 icon={Clock}        accentColor="#ffb700" />
                </div>

                {/* ── Ask MindPad AI (full width) ── */}
                <div style={{ ...panel, marginBottom: 24 }}>
                  <div style={{
                    padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={14} style={{ color: '#40b8ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Ask MindPad AI</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#40b8ff', letterSpacing: '0.04em' }}>
                      <Sparkles size={11} />Execution Assistant
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    {/* Suggested questions */}
                    {!askResult && !askLoading && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                        {SUGGESTED_QUESTIONS.map(q => (
                          <button key={q} onClick={() => handleSuggestedQuestion(q)} style={{
                            padding: '5px 12px', borderRadius: 99,
                            background: question === q ? 'rgba(0,130,255,0.14)' : 'rgba(0,80,160,0.08)',
                            border: `1px solid ${question === q ? 'rgba(0,160,255,0.35)' : 'rgba(0,160,255,0.14)'}`,
                            color: question === q ? 'rgba(140,200,255,0.95)' : 'rgba(100,150,200,0.75)',
                            fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input row */}
                    <form onSubmit={handleAsk} style={{ display: 'flex', gap: 10 }}>
                      <input
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="What should I focus on? Create a plan. Which task has the highest leverage?"
                        disabled={askLoading}
                        style={{
                          flex: 1, height: 42, padding: '0 14px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,160,255,0.18)',
                          color: 'rgba(200,220,245,0.92)', fontSize: 13, outline: 'none',
                          fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = 'rgba(0,160,255,0.45)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.08)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'rgba(0,160,255,0.18)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button type="submit" disabled={askLoading || !question.trim()} style={{
                        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                        background: question.trim() ? 'linear-gradient(135deg, #0080d8, #0055a8)' : 'rgba(0,80,160,0.12)',
                        border: '1px solid rgba(0,160,255,0.25)',
                        color: question.trim() ? '#fff' : 'rgba(80,120,170,0.5)',
                        cursor: question.trim() && !askLoading ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {askLoading
                          ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                          : <Send size={15} />}
                      </button>
                    </form>

                    {/* Error */}
                    {askError && (
                      <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(239,68,68,0.8)' }}>{askError}</p>
                    )}

                    {/* Answer */}
                    {askResult && (
                      <div style={{ marginTop: 16 }}>
                        {/* Main answer */}
                        <div style={{
                          padding: '12px 16px', borderRadius: 10, marginBottom: 14,
                          background: 'rgba(0,80,200,0.07)', borderLeft: '3px solid rgba(0,160,255,0.5)',
                          fontSize: 14, color: 'rgba(200,225,255,0.92)', lineHeight: 1.65,
                        }}>
                          {askResult.answer}
                        </div>

                        {/* Sections */}
                        {askResult.sections.length > 0 && (
                          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}
                            className="md:grid-cols-2">
                            {askResult.sections.map((s, i) => (
                              <div key={i} style={{
                                padding: '12px 14px', borderRadius: 10,
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.1)',
                              }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#40b8ff', marginBottom: 6 }}>
                                  {s.title}
                                </p>
                                <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.55 }}>
                                  {s.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested actions */}
                        {askResult.suggestedActions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 11, color: 'rgba(80,110,160,0.7)', alignSelf: 'center' }}>Next:</span>
                            {askResult.suggestedActions.map((action, i) => (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 12px', borderRadius: 99,
                                background: 'rgba(0,130,255,0.08)', border: '1px solid rgba(0,160,255,0.18)',
                                fontSize: 12, color: 'rgba(120,180,255,0.9)',
                              }}>
                                <ChevronRight size={11} />{action}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reset */}
                        <button onClick={() => { setAskResult(null); setQuestion(''); }} style={{
                          marginTop: 12, fontSize: 11, color: 'rgba(70,100,140,0.65)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        }}>
                          Ask another question
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 24 }} className="md:grid-cols-3">
                  {/* Left 2/3 */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* AI Morning Brief */}
                    <PanelCard
                      title="AI Morning Brief"
                      badge={<Badge variant="info" className="ml-1">MindPad AI</Badge>}
                      action={
                        brief ? (
                          <button onClick={() => setBrief(null)} style={{ fontSize: 11, color: 'rgba(80,110,160,0.65)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Refresh
                          </button>
                        ) : undefined
                      }
                    >
                      {!brief ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)', lineHeight: 1.6 }}>
                            Generate a personalized AI brief based on your tasks, focus history, and notes.
                          </p>
                          <Button size="sm" onClick={handleGenerateBrief} loading={briefLoading}>
                            <Sparkles size={13} /> Generate Brief
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Main priority */}
                          <div style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: 'rgba(255,150,0,0.06)', border: '1px solid rgba(255,185,0,0.2)',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                          }}>
                            <Zap size={14} style={{ color: '#ffb700', flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffb700', marginBottom: 4 }}>Main Priority</p>
                              <p style={{ fontSize: 13, color: 'rgba(200,220,245,0.92)', lineHeight: 1.55, fontWeight: 500 }}>{brief.mainPriority}</p>
                            </div>
                          </div>

                          {/* Top actions */}
                          {brief.topActions.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(100,140,190,0.7)', marginBottom: 8 }}>Top 3 Actions</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {brief.topActions.map((action, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{
                                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                      background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.2)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 700, color: '#40b8ff',
                                    }}>{i + 1}</span>
                                    <span style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>{action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Focus block suggestion */}
                          {brief.suggestedFocusBlock && (
                            <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(0,80,200,0.07)', border: '1px solid rgba(0,160,255,0.12)', fontSize: 13, color: 'rgba(150,200,255,0.85)', lineHeight: 1.55 }}>
                              <Timer size={12} style={{ display: 'inline', marginRight: 6, color: '#40b8ff', verticalAlign: 'middle' }} />
                              {brief.suggestedFocusBlock}
                            </div>
                          )}

                          {/* Warning */}
                          {brief.warning && (
                            <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(220,150,0,0.07)', border: '1px solid rgba(220,150,0,0.2)', fontSize: 12, color: 'rgba(255,185,100,0.85)' }}>
                              ⚠ {brief.warning}
                            </div>
                          )}

                          {/* Message */}
                          {brief.message && (
                            <p style={{ fontSize: 12, color: 'rgba(80,120,170,0.75)', fontStyle: 'italic', borderTop: '1px solid rgba(0,160,255,0.07)', paddingTop: 12 }}>
                              "{brief.message}"
                            </p>
                          )}
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
                              transition: 'background 0.15s', background: 'rgba(0,0,0,0)',
                            }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,100,200,0.05)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'}
                            >
                              <button onClick={() => handleToggleTask(task)} style={{
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
                          { href: '/brain-dump', icon: Brain,    label: 'New Brain Dump', primary: true },
                          { href: '/focus',      icon: Timer,    label: 'Start Focus',    primary: false },
                          { href: '/tasks',      icon: ListTodo, label: 'Manage Tasks',   primary: false },
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
                            <Icon size={15} />{label}
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
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                          <p style={{ fontSize: 12, color: 'rgba(90,120,160,0.7)', marginBottom: 8 }}>No notes yet</p>
                          <Link href="/brain-dump" style={{ fontSize: 11, fontWeight: 600, color: '#40b8ff', textDecoration: 'none' }}>
                            Start a brain dump →
                          </Link>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {brainDumps.map(dump => (
                            <div key={dump.id} style={{
                              padding: 12, borderRadius: 10,
                              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.08)',
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

                    {/* Team card — shown only when workspace exists */}
                    {teamState?.workspace && (
                      <PanelCard
                        title="Team Workspace"
                        action={
                          <Link href="/team" style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                            Open <ArrowRight size={10} />
                          </Link>
                        }
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                              background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Users size={15} style={{ color: '#a78bfa' }} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(200,220,245,0.95)' }}>{teamState.workspace.name}</p>
                              <p style={{ fontSize: 11, color: 'rgba(90,120,160,0.7)' }}>
                                {teamState.workspace.memberCount} member{teamState.workspace.memberCount !== 1 ? 's' : ''}
                                {(teamState.workspace.pendingInvites?.length ?? 0) > 0 && (
                                  <span style={{ color: '#40b8ff', marginLeft: 6 }}>
                                    · {teamState.workspace.pendingInvites.length} pending
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {teamState.workspace.activityFeed?.[0] && (
                            <div style={{
                              padding: '8px 10px', borderRadius: 8,
                              background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,160,255,0.07)',
                              fontSize: 11, color: 'rgba(110,150,200,0.75)',
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {teamState.workspace.activityFeed[0].action}
                            </div>
                          )}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
