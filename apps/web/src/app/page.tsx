'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  Timer,
  BarChart3,
  CheckSquare,
  Moon,
  ArrowRight,
  Target,
  CheckCircle2,
  Zap,
  ListTodo,
} from 'lucide-react';

// ── Hero Animation ──────────────────────────────────────────

const DUMP_TEXT =
  `need to finish API redesign by Thursday, client presentation is tomorrow and slides aren't ready, there's a memory leak in auth service causing prod issues, and 4 PRs waiting for review...`;

const TASKS = [
  { text: 'Finish API redesign by Thursday', priority: 'HIGH', color: '#f87171' },
  { text: 'Prepare client presentation slides', priority: 'HIGH', color: '#f87171' },
  { text: 'Fix auth service memory leak', priority: 'MED',  color: '#fbbf24' },
  { text: 'Review 4 open pull requests', priority: 'LOW',  color: '#4ade80' },
];

function HeroAnimation() {
  const [typedChars, setTypedChars]     = useState(0);
  const [aiProgress, setAiProgress]     = useState(0);
  const [visibleTasks, setVisibleTasks] = useState(0);
  const [showFocus, setShowFocus]       = useState(false);
  const [phase, setPhase]               = useState<'type' | 'process' | 'tasks' | 'focus'>('type');
  const [cycle, setCycle]               = useState(0);
  const cardRef                         = useRef<HTMLDivElement>(null);
  const [tilt, setTilt]                 = useState({ x: 3, y: -8 });

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[]    = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    setTypedChars(0);
    setAiProgress(0);
    setVisibleTasks(0);
    setShowFocus(false);
    setPhase('type');

    // Phase 1 — type the brain dump
    let chars = 0;
    const typeInt = setInterval(() => {
      chars++;
      setTypedChars(chars);
      if (chars >= DUMP_TEXT.length) {
        clearInterval(typeInt);
        setPhase('process');

        // Phase 2 — AI progress bar
        let prog = 0;
        const progInt = setInterval(() => {
          prog += 2.5;
          setAiProgress(Math.min(Math.round(prog), 100));
          if (prog >= 100) {
            clearInterval(progInt);
            setPhase('tasks');

            // Phase 3 — tasks one by one
            TASKS.forEach((_, i) => {
              timers.push(setTimeout(() => setVisibleTasks(i + 1), (i + 1) * 500));
            });

            // Phase 4 — focus recommendation
            timers.push(
              setTimeout(() => {
                setShowFocus(true);
                setPhase('focus');
              }, TASKS.length * 500 + 400)
            );

            // Loop
            timers.push(
              setTimeout(() => setCycle((c) => c + 1), TASKS.length * 500 + 4200)
            );
          }
        }, 20);
        intervals.push(progInt);
      }
    }, 18);
    intervals.push(typeInt);

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [cycle]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 12, y: -x * 14 });
  }
  function handleMouseLeave() {
    setTilt({ x: 3, y: -8 });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full"
      style={{
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.12s ease',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* Ambient glow behind card */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-60px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 60% 50%, rgba(12,146,232,0.18) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Glass card */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Window chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <Brain size={12} color="#0c92e8" />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Brain Dump</span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              color: phase === 'process' ? '#fbbf24' : '#4ade80',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: phase === 'process' ? '#fbbf24' : '#4ade80',
                animation: phase === 'process' ? 'glow-pulse 1s ease-in-out infinite' : 'none',
              }}
            />
            {phase === 'type' ? 'Capturing...' : phase === 'process' ? 'AI Processing...' : 'Tasks ready'}
          </div>
        </div>

        {/* Textarea */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '10px 12px',
              minHeight: 80,
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.65,
              color: '#cbd5e1',
              wordBreak: 'break-word',
            }}
          >
            {DUMP_TEXT.slice(0, typedChars)}
            {typedChars < DUMP_TEXT.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 12,
                  background: '#0c92e8',
                  marginLeft: 1,
                  verticalAlign: 'text-bottom',
                  animation: 'blink-cursor 0.75s step-end infinite',
                }}
              />
            )}
          </div>

          {/* Progress bar */}
          {aiProgress > 0 && (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={11} color="#7c3aed" />
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                    Gemini AI extracting tasks
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>{aiProgress}%</span>
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${aiProgress}%`,
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, #0c92e8, #7c3aed)',
                    transition: 'width 0.04s linear',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Extracted tasks */}
        <div style={{ padding: '14px 16px' }}>
          {visibleTasks === 0 && phase === 'type' && (
            <p style={{ fontSize: 11, color: '#334155', textAlign: 'center', padding: '12px 0' }}>
              Write your thoughts — AI extracts tasks
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TASKS.slice(0, visibleTasks).map((task, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  animation: 'slide-in-right 0.35s ease forwards',
                }}
              >
                <CheckCircle2 size={13} color={task.color} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: '#e2e8f0' }}>{task.text}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '2px 6px',
                    borderRadius: 99,
                    background: `${task.color}22`,
                    color: task.color,
                    flexShrink: 0,
                  }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>

          {/* Focus recommendation */}
          {showFocus && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'rgba(12,146,232,0.1)',
                border: '1px solid rgba(12,146,232,0.25)',
                borderRadius: 8,
                padding: '8px 10px',
                animation: 'fade-in 0.4s ease forwards',
              }}
            >
              <Target size={13} color="#0c92e8" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#7cc8fb', marginBottom: 2 }}>
                  Focus now
                </p>
                <p style={{ fontSize: 11, color: '#cbd5e1' }}>API redesign by Thursday</p>
              </div>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#0c92e8', flexShrink: 0 }}>
                25:00
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Landing Page ────────────────────────────────────────────

const PAGE_BG = '#070d1a';

export default function LandingPage() {
  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', color: '#f1f5f9' }}>
      {/* Background ambient glows */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-100px',
            width: 900,
            height: 900,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(12,146,232,0.07) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '-150px',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: '20%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Nav ── */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(7,13,26,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={22} color="#0c92e8" />
              <span style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>MindPad</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: '#0c92e8',
                  background: 'rgba(12,146,232,0.12)',
                  border: '1px solid rgba(12,146,232,0.25)',
                  borderRadius: 99,
                  padding: '2px 8px',
                  marginLeft: 2,
                }}
              >
                AI
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/login"
                style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 18px',
                  background: '#0c92e8',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(12,146,232,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 48,
              alignItems: 'center',
            }}
            className="md:grid-cols-2 grid-cols-1"
          >
            {/* Left — copy */}
            <div>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  borderRadius: 99,
                  border: '1px solid rgba(12,146,232,0.3)',
                  background: 'rgba(12,146,232,0.08)',
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0c92e8',
                    animation: 'glow-pulse 2s ease-in-out infinite',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#7cc8fb' }}>
                  AI-POWERED PRODUCTIVITY
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(36px, 5vw, 58px)',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  marginBottom: 20,
                  color: '#f1f5f9',
                }}
              >
                Turn scattered{' '}
                <br />
                thoughts into{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0c92e8 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  focused execution
                </span>
              </h1>

              <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.65, marginBottom: 36, maxWidth: 420 }}>
                MindPad captures your brain dumps, extracts actionable tasks with Gemini AI,
                and keeps you in deep work with a built-in Pomodoro timer.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 28px',
                    background: '#0c92e8',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(12,146,232,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Start for free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 28px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: 15,
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.color = '#f1f5f9';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  Open workspace
                </Link>
              </div>

              {/* Social proof */}
              <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', fontSize: 12, color: '#475569' }}>
                  {['✓ Free forever', '✓ No credit card', '✓ Gemini AI'].map((t) => (
                    <span key={t} style={{ marginRight: 14 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — animation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <HeroAnimation />
            </div>
          </div>
        </section>

        {/* ── Divider glow ── */}
        <div
          aria-hidden
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(12,146,232,0.3), rgba(124,58,237,0.3), transparent)',
          }}
        />

        {/* ── How it works ── */}
        <section
          style={{
            background: 'rgba(255,255,255,0.01)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '80px 0',
          }}
        >
          <div className="max-w-5xl mx-auto px-6">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.02em' }}>
                How it works
              </h2>
              <p style={{ color: '#64748b', fontSize: 15 }}>Three steps from chaos to clarity</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="grid-cols-1 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Capture',
                  desc: 'Brain-dump everything cluttering your mind — tasks, ideas, worries, plans. No structure needed.',
                  icon: Brain,
                  accent: '#0c92e8',
                },
                {
                  step: '02',
                  title: 'Organize',
                  desc: 'Gemini AI reads your dump, extracts prioritized actionable tasks, and recommends where to start.',
                  icon: Sparkles,
                  accent: '#7c3aed',
                },
                {
                  step: '03',
                  title: 'Execute',
                  desc: 'Work through tasks with a built-in Pomodoro timer. Every session logged. Every minute tracked.',
                  icon: Target,
                  accent: '#22d3ee',
                },
              ].map(({ step, title, desc, icon: Icon, accent }) => (
                <div
                  key={step}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${accent}40`;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 20,
                      fontSize: 52,
                      fontWeight: 900,
                      color: 'rgba(255,255,255,0.04)',
                      lineHeight: 1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {step}
                  </span>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${accent}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={20} color={accent} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '80px 0' }}>
          <div className="max-w-5xl mx-auto px-6">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.02em' }}>
                Everything you need
              </h2>
              <p style={{ color: '#64748b', fontSize: 15 }}>A complete productivity stack in one focused app</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="grid-cols-2 md:grid-cols-3">
              {[
                { icon: Brain,     title: 'Brain Dump',     desc: 'Free-form capture for scattered thoughts', accent: '#0c92e8' },
                { icon: Sparkles,  title: 'Gemini AI',      desc: 'Turn raw thoughts into prioritized task lists', accent: '#7c3aed' },
                { icon: Timer,     title: 'Pomodoro Timer', desc: 'SVG ring timer with pause/resume/reset', accent: '#22d3ee' },
                { icon: BarChart3, title: 'Analytics',      desc: 'Completion rates, focus time, streaks', accent: '#f59e0b' },
                { icon: Moon,      title: 'Dark Mode',      desc: 'First-class dark theme, zero flash', accent: '#94a3b8' },
                { icon: ListTodo,  title: 'Task Priorities', desc: 'High/Medium/Low with smart filtering', accent: '#4ade80' },
              ].map(({ icon: Icon, title, desc, accent }) => (
                <div
                  key={title}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '20px 18px',
                    transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${accent}35`;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${accent}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Icon size={17} color={accent} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: '0 0 80px' }}>
          <div className="max-w-5xl mx-auto px-6">
            <div
              style={{
                borderRadius: 20,
                padding: '60px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #070d1a 0%, #0a1628 50%, #0c0a1e 100%)',
                border: '1px solid rgba(12,146,232,0.2)',
              }}
            >
              {/* Glow blobs */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-60px',
                  left: '20%',
                  width: 400,
                  height: 400,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(12,146,232,0.15) 0%, transparent 65%)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: '-60px',
                  right: '20%',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(12,146,232,0.15)',
                    border: '1px solid rgba(12,146,232,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <Zap size={24} color="#0c92e8" />
                </div>
                <h2 style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.02em' }}>
                  Ready to focus?
                </h2>
                <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                  Free forever. No credit card. Start capturing your first brain dump in seconds.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Link
                    href="/register"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 32px',
                      background: '#0c92e8',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 10,
                      textDecoration: 'none',
                      transition: 'opacity 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(12,146,232,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Create free account
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '14px 28px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: 15,
                      borderRadius: 10,
                      textDecoration: 'none',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 0' }}>
          <div
            className="max-w-6xl mx-auto px-6"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} color="#0c92e8" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>MindPad AI</span>
            </div>
            <p style={{ fontSize: 12, color: '#334155' }}>
              © {new Date().getFullYear()} MindPad AI — Portfolio project.
            </p>
            <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
              {[
                { label: 'Sign In', href: '/login' },
                { label: 'Register', href: '/register' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
