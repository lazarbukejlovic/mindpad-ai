'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Target, Timer, CheckCircle2, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import NeuralBackground from '@/components/ui/NeuralBackground';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface OrganizeResult {
  summary: string;
  tasks: string[];
  priorities: string[];
  estimatedMinutes: number[];
  focusRecommendation: string;
  reasoning: string;
  mode: 'ai' | 'offline';
}

// ── Goal options ───────────────────────────────────────────────────────────────

const GOALS = [
  { id: 'clear-backlog',  label: 'Clear my backlog',              icon: '📋' },
  { id: 'plan-day',       label: 'Plan my day',                   icon: '📅' },
  { id: 'project',        label: 'Organize a project',            icon: '🗂️' },
  { id: 'client-meeting', label: 'Prepare for a client meeting',  icon: '🤝' },
  { id: 'regain-focus',   label: 'Recover focus',                 icon: '🎯' },
  { id: 'team-execution', label: 'Improve team execution',        icon: '👥' },
];

// ── Starter brain-dump prompts ────────────────────────────────────────────────

const STARTERS: Record<string, string> = {
  overloaded: `Too many open tasks right now. I need to figure out what actually matters.

Current unfinished work I keep thinking about:
-

Deadlines I'm worried about:
-

Things blocking me from making progress:
- `,

  client: `Preparing for a client meeting and need to get organized.

Meeting goal and outcome I want:

Key points to cover:
-

Materials or deliverables I need to prepare:
-

Open questions I still need to answer:
- `,

  project: `I have a project I need to get moving on. It isn't organized yet.

Project goal:

Where things stand right now:

Clearest next steps:
-

Blockers or unknowns:
- `,

  distracted: `I'm scattered and can't focus. My mind keeps jumping between things.

Everything competing for my attention right now:
-

The one thing I should actually be doing:

What's stopping me from starting:`,

  weekly: `I need to plan out my week and figure out what to actually execute.

Top priorities this week:
-

Deadlines and commitments:
-

Things that keep getting pushed back:
-

Realistic time I have this week:`,
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.80)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0, 160, 255, 0.14)',
  borderRadius: '1.25rem',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { checking } = useSessionRestore();

  const [step, setStep]       = useState<Step>(1);
  const [goal, setGoal]       = useState('');
  const [dumpText, setDumpText] = useState('');
  const [extractResult, setExtractResult] = useState<OrganizeResult | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError]     = useState('');
  const [completing, setCompleting]         = useState(false);
  const [savingGoal, setSavingGoal]         = useState(false);

  // Redirect existing-data users or already-onboarded users away
  useEffect(() => {
    if (checking) return;
    ApiClient.getOnboardingStatus().then(s => {
      if (s.onboardingCompleted) router.replace('/dashboard');
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(3, 6, 14)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSelectGoal(goalId: string) {
    setGoal(goalId);
    setSavingGoal(true);
    try {
      await ApiClient.updateOnboardingStatus({ onboardingGoal: goalId });
    } catch { /* non-blocking */ }
    setSavingGoal(false);
    setStep(2);
  }

  function applyStarter(key: string) {
    setDumpText(STARTERS[key] || '');
  }

  async function handleExtract(e: FormEvent) {
    e.preventDefault();
    if (!dumpText.trim()) return;
    setExtractError('');
    setExtractLoading(true);
    try {
      const result = await ApiClient.organizeBrainDump(dumpText.trim());
      setExtractResult(result as OrganizeResult);
      await ApiClient.updateOnboardingStatus({ firstBrainDumpCompleted: true }).catch(() => {});
      setStep(3);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not extract tasks. Please try again.');
    } finally {
      setExtractLoading(false);
    }
  }

  async function handleAcceptAndContinue() {
    if (!extractResult) return;
    try {
      const payloads = extractResult.tasks.slice(0, 6).map((title, i) => ({
        title,
        priority: (extractResult.priorities[i] || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
      }));
      await ApiClient.createTasksBulk(payloads);
      await ApiClient.updateOnboardingStatus({ firstTasksExtracted: true }).catch(() => {});
    } catch { /* silent — tasks may already exist */ }
    setStep(4);
  }

  async function handleStartFocus() {
    await ApiClient.updateOnboardingStatus({ firstFocusStarted: true }).catch(() => {});
    await handleComplete();
    router.push('/focus');
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await ApiClient.completeOnboarding();
    } catch { /* non-blocking */ }
    setCompleting(false);
    if (step !== 4) router.push('/dashboard');
  }

  async function handleSkipToComplete() {
    await ApiClient.completeOnboarding().catch(() => {});
    router.push('/dashboard');
  }

  // ── Focus recommendation ─────────────────────────────────────────────────────

  const primaryTask = extractResult?.tasks[0] ?? null;
  const primaryMinutes = extractResult?.estimatedMinutes[0] ?? 25;
  const suggestedDuration = primaryMinutes >= 45 ? 50 : 25;

  // ── Progress bar ─────────────────────────────────────────────────────────────

  const progress = ((step - 1) / 4) * 100;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,160,255,0.7)' }}>
              MindPad AI
            </span>
            <span style={{ fontSize: 11, color: 'rgba(80,110,150,0.7)' }}>Step {step} of 5</span>
          </div>
          <div style={{ height: 3, background: 'rgba(0,80,160,0.18)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #0080d8, #40c8ff)',
              boxShadow: '0 0 10px rgba(0,160,255,0.5)',
              width: `${progress}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* ── Step 1: Welcome + Goal ── */}
        {step === 1 && (
          <div style={{ ...card, width: '100%', maxWidth: 560, padding: '40px 36px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, margin: '0 auto 20px',
                background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 32px rgba(0,120,255,0.2)',
              }}>
                <Brain size={26} style={{ color: '#40b8ff' }} />
              </div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10,
                background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Welcome to MindPad AI
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(100,140,190,0.85)', lineHeight: 1.6 }}>
                Turn scattered thoughts into focused execution.
                <br />What's your main goal right now?
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleSelectGoal(g.id)}
                  disabled={savingGoal}
                  style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                    background: goal === g.id ? 'rgba(0,130,255,0.14)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${goal === g.id ? 'rgba(0,160,255,0.4)' : 'rgba(0,160,255,0.1)'}`,
                    color: goal === g.id ? 'rgba(160,210,255,0.95)' : 'rgba(130,170,210,0.8)',
                    cursor: savingGoal ? 'wait' : 'pointer',
                    fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>

            {savingGoal && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <Spinner size="sm" />
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Guided Brain Dump ── */}
        {step === 2 && (
          <div style={{ ...card, width: '100%', maxWidth: 600, padding: '36px' }}>
            <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(80,110,150,0.7)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
              <ArrowLeft size={13} /> Back
            </button>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8,
                background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Empty your mind
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(100,140,190,0.85)', lineHeight: 1.65 }}>
                Write everything on your mind right now — unfinished work, deadlines, meetings, worries, ideas, blockers. MindPad will turn it into clear next actions.
              </p>
            </div>

            {/* Starter buttons */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(80,110,150,0.7)', marginBottom: 10 }}>
                Start with a prompt
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'overloaded',  label: 'Too many unfinished tasks' },
                  { key: 'client',      label: 'Preparing for a client meeting' },
                  { key: 'project',     label: 'Organizing a project' },
                  { key: 'distracted',  label: 'Feeling scattered and unfocused' },
                  { key: 'weekly',      label: 'Planning my week' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => applyStarter(s.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                      background: 'rgba(0,80,160,0.08)', border: '1px solid rgba(0,160,255,0.15)',
                      color: 'rgba(100,150,200,0.8)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,100,200,0.14)'; (e.currentTarget as HTMLElement).style.color = '#80c8ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,80,160,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(100,150,200,0.8)'; }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleExtract}>
              <textarea
                value={dumpText}
                onChange={e => setDumpText(e.target.value)}
                placeholder="Start writing — or pick a prompt above to get started…"
                rows={10}
                style={{
                  width: '100%', borderRadius: 12, padding: '14px 16px',
                  background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(0,160,255,0.18)',
                  color: 'rgba(200,220,245,0.92)', fontSize: 13, lineHeight: 1.7,
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,160,255,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(0,160,255,0.18)'; e.target.style.boxShadow = 'none'; }}
              />

              {extractError && (
                <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(239,68,68,0.85)' }}>{extractError}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(70,100,140,0.6)' }}>
                  {dumpText.trim().length} characters
                </span>
                <Button type="submit" disabled={!dumpText.trim() || extractLoading} loading={extractLoading}>
                  <Sparkles size={14} />
                  Extract tasks
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Extraction results ── */}
        {step === 3 && extractResult && (
          <div style={{ ...card, width: '100%', maxWidth: 600, padding: '36px' }}>
            <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(80,110,150,0.7)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
              <ArrowLeft size={13} /> Back
            </button>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8,
                background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Your first action list
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(100,140,190,0.85)' }}>
                {extractResult.summary}
              </p>
            </div>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {extractResult.tasks.slice(0, 6).map((task, i) => {
                const pri = (extractResult.priorities[i] || 'medium').toLowerCase();
                const priColor = pri === 'high' ? '#ef4444' : pri === 'medium' ? '#f59e0b' : '#22c55e';
                const priLabel = pri.charAt(0).toUpperCase() + pri.slice(1);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: i === 0 ? 'rgba(0,100,255,0.07)' : 'rgba(0,0,0,0.25)',
                    border: `1px solid ${i === 0 ? 'rgba(0,160,255,0.2)' : 'rgba(0,160,255,0.08)'}`,
                  }}>
                    {i === 0 ? (
                      <Zap size={14} style={{ color: '#40b8ff', flexShrink: 0 }} />
                    ) : (
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0, fontSize: 10, fontWeight: 700,
                        background: 'rgba(0,80,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(80,130,190,0.8)',
                      }}>{i + 1}</span>
                    )}
                    <p style={{ flex: 1, fontSize: 13, color: i === 0 ? 'rgba(200,225,255,0.95)' : 'rgba(170,200,240,0.85)', fontWeight: i === 0 ? 600 : 400 }}>
                      {task}
                    </p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: `${priColor}18`, border: `1px solid ${priColor}40`,
                      color: priColor, flexShrink: 0,
                    }}>{priLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Focus recommendation */}
            {extractResult.focusRecommendation && (
              <div style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 20,
                background: 'rgba(255,185,0,0.05)', border: '1px solid rgba(255,185,0,0.18)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Target size={14} style={{ color: '#ffb700', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'rgba(200,210,180,0.85)', lineHeight: 1.55 }}>
                  {extractResult.focusRecommendation}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleAcceptAndContinue}>
                Add to task list <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Focus recommendation ── */}
        {step === 4 && (
          <div style={{ ...card, width: '100%', maxWidth: 520, padding: '40px 36px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: '0 auto 20px',
              background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Timer size={26} style={{ color: '#40b8ff' }} />
            </div>

            <h2 style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10,
              background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Your first focus session
            </h2>

            <p style={{ fontSize: 13, color: 'rgba(100,140,190,0.85)', lineHeight: 1.65, marginBottom: 24 }}>
              Pick the task that will move work forward. Start small — one session builds momentum.
            </p>

            <div style={{
              padding: '18px 20px', borderRadius: 14, marginBottom: 24,
              background: 'rgba(0,100,255,0.07)', border: '1px solid rgba(0,160,255,0.2)',
            }}>
              {primaryTask && (
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(200,225,255,0.92)', marginBottom: 10 }}>
                  {primaryTask}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Timer size={14} style={{ color: '#40b8ff' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#40b8ff' }}>
                  {suggestedDuration}-minute focus session
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button onClick={handleStartFocus} loading={completing}>
                <Timer size={14} />
                Start first focus session
              </Button>
              <button
                onClick={() => { setStep(5); handleComplete(); }}
                style={{ fontSize: 12, color: 'rgba(80,110,150,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
              >
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Completion ── */}
        {step === 5 && (
          <div style={{ ...card, width: '100%', maxWidth: 520, padding: '40px 36px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: '0 auto 20px',
              background: 'rgba(0,200,80,0.1)', border: '1px solid rgba(0,200,80,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={26} style={{ color: '#22c55e' }} />
            </div>

            <h2 style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10,
              background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              You're ready to execute.
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(100,140,190,0.85)', lineHeight: 1.65, marginBottom: 28 }}>
              Your workspace is set up. You have tasks, a focus plan, and a clear starting point.
            </p>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
              {[
                { done: !!goal,              label: 'Goal selected' },
                { done: !!extractResult,     label: 'First brain dump added' },
                { done: !!extractResult,     label: 'Tasks extracted and saved' },
                { done: false,               label: 'First focus session', sub: 'Waiting for you in Focus' },
                { done: false,               label: 'Review your analytics', sub: 'After your first session' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: item.done ? 'rgba(34,197,94,0.12)' : 'rgba(0,80,160,0.1)',
                    border: `1px solid ${item.done ? 'rgba(34,197,94,0.35)' : 'rgba(0,160,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done
                      ? <CheckCircle2 size={11} style={{ color: '#22c55e' }} />
                      : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,160,255,0.4)', display: 'block' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: item.done ? 'rgba(200,230,200,0.9)' : 'rgba(120,160,200,0.75)', fontWeight: item.done ? 500 : 400 }}>
                      {item.label}
                    </p>
                    {item.sub && (
                      <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.65)', marginTop: 1 }}>{item.sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleSkipToComplete} loading={completing} style={{ width: '100%', justifyContent: 'center' }}>
              Go to Dashboard <ArrowRight size={14} />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
