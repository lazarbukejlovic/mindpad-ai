'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  Timer,
  BarChart3,
  ArrowRight,
  Target,
  CheckCircle2,
  Zap,
  ListTodo,
  FileText,
  CloudLightning,
  Play,
  X,
  Cpu,
  TrendingUp,
} from 'lucide-react';

// ─── Scroll reveal ────────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealWords({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className} style={{ display: 'block', ...style }}>
      {text.split(' ').map((word, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.28em', verticalAlign: 'bottom' }}>
          <span style={{
            display: 'inline-block',
            transform: visible ? 'translateY(0)' : 'translateY(105%)',
            opacity: visible ? 1 : 0,
            transition: `transform 0.52s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s, opacity 0.4s ease ${i * 0.06}s`,
          }}>
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const DUMP_TEXT = `finish landing page, review job applications, prepare tomorrow's focus list, clean inbox, follow up on proposal`;

const AI_TASKS = [
  { text: 'Refine landing page', priority: 'HIGH', color: '#f87171' },
  { text: 'Send proposal follow-up', priority: 'HIGH', color: '#f87171' },
  { text: 'Review 3 job applications', priority: 'MED', color: '#fbbf24' },
  { text: "Plan tomorrow's priority", priority: 'MED', color: '#fbbf24' },
  { text: 'Clean inbox', priority: 'LOW', color: '#4ade80' },
];

const STEPS = [
  { n: '01', icon: Brain,    title: 'Capture your messy mind',   desc: 'Dump everything in one place. No formatting, no rules — just raw thoughts.', accent: '#0c92e8' },
  { n: '02', icon: Sparkles, title: 'AI extracts action items',  desc: 'MindPad AI reads your dump and surfaces structured, actionable tasks.',       accent: '#7c3aed' },
  { n: '03', icon: Target,   title: 'Prioritize the next move',  desc: 'AI tells you what to focus on first. Accept the tasks that fit your goals.',  accent: '#D4FF3F' },
  { n: '04', icon: Timer,    title: 'Start deep focus',          desc: 'Lock in with a 25, 50, or 90-minute session tied to your top priority.',      accent: '#38bdf8' },
  { n: '05', icon: BarChart3, title: 'Track your progress',      desc: 'See streaks, focus time, and completed tasks to build real momentum.',        accent: '#4ade80' },
];

const FEATURES = [
  { icon: Brain,          title: 'Brain Dump Capture',       desc: 'Turn cluttered notes into a single source of truth instantly.' },
  { icon: Sparkles,       title: 'AI Task Extraction',        desc: 'Get structured tasks from raw thoughts in seconds with MindPad AI.' },
  { icon: Target,         title: 'Focus First',               desc: 'Smart prioritization tells you exactly what to work on next.' },
  { icon: ListTodo,       title: 'Task Management',           desc: 'Filter, edit, and organize tasks without losing your flow state.' },
  { icon: Timer,          title: 'Focus Timer',               desc: 'Built-in Pomodoro-style timer keeps your deep work sessions on track.' },
  { icon: BarChart3,      title: 'Progress Analytics',        desc: 'Track focus time, completion streaks, and task momentum over time.' },
  { icon: FileText,       title: 'Saved Notes',               desc: 'Archive every brain dump and AI summary for future reference.' },
  { icon: CloudLightning, title: 'Priority Signals',          desc: 'High/Medium/Low signals make every prioritization decision clear.' },
];

const FAQS = [
  { q: 'What exactly does MindPad AI do?',            a: 'It captures messy brain dumps, extracts actionable tasks with AI, recommends what to focus on first, and tracks your progress — one integrated workflow from thought to execution.' },
  { q: 'Who is MindPad AI for?',                      a: 'Anyone who wants to turn fast-moving ideas into clear execution: founders, developers, freelancers, students, job seekers, and creators.' },
  { q: 'Does it replace my task manager?',            a: 'MindPad AI complements task managers by turning disorganized thinking into structured tasks you can act on immediately, without the overhead of manual entry.' },
  { q: 'Does the AI create tasks automatically?',     a: 'Yes — AI reads your brain dump and suggests structured task items. You choose which to keep, prioritize, and act on.' },
  { q: 'Is MindPad AI free?',                         a: 'Yes — the full core workflow is free forever: brain dumps, AI task extraction, tasks, focus sessions, and basic analytics.' },
  { q: 'Will Pro include advanced planning?',         a: 'Pro will add advanced analytics, full focus history, daily planning workflows, and deeper priority insights.' },
  { q: 'Is my data saved?',                           a: 'Your notes, tasks, and focus sessions persist in your workspace. Analytics track your progress and streaks over time.' },
  { q: 'Can I use it for work, school, and personal tasks?', a: 'Absolutely — MindPad handles all kinds of thinking, from professional projects to personal priorities and student assignments.' },
];

// ─── Neural background ────────────────────────────────────────────────────────

const NEURAL_PATHS = [
  { d: 'M -20,155 C 360,128 720,185 1080,148 C 1260,136 1380,158 1460,145', color: '#0c92e8', delay: 0 },
  { d: 'M -20,468 C 280,443 560,498 840,462 C 1080,440 1300,490 1460,470', color: '#D4FF3F', delay: 2 },
  { d: 'M -20,755 C 300,732 600,775 900,748 C 1120,732 1320,762 1460,750', color: '#7c3aed', delay: 4 },
  { d: 'M 125,-10 C 105,185 145,365 125,545 C 105,725 132,845 125,910',  color: '#0c92e8', delay: 1 },
  { d: 'M 718,-10 C 698,162 738,325 718,488 C 698,645 738,805 718,910',  color: '#D4FF3F', delay: 3 },
  { d: 'M 1318,-10 C 1298,185 1338,365 1318,545 C 1298,725 1325,845 1318,910', color: '#7c3aed', delay: 5 },
];

const NEURAL_NODES = [
  { x: 125, y: 155 }, { x: 718, y: 155 }, { x: 1318, y: 155 },
  { x: 125, y: 468 }, { x: 718, y: 468 }, { x: 1318, y: 468 },
  { x: 125, y: 755 }, { x: 718, y: 755 }, { x: 1318, y: 755 },
];

function NeuralBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Gradient base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 30% 0%, rgba(12,146,232,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,58,237,0.03) 0%, transparent 60%)',
      }} />

      {/* Neural SVG — paths + nodes */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 1 }}
      >
        {NEURAL_PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            stroke={p.color}
            strokeOpacity={0.06}
            strokeWidth="1"
            fill="none"
            strokeDasharray="8 40"
            style={{
              animation: `dash-flow ${9 + i * 1.4}s linear infinite`,
              animationDelay: `${p.delay * -1.4}s`,
            }}
          />
        ))}
        {NEURAL_NODES.map((n, i) => (
          <g key={`node-${i}`}>
            <circle cx={n.x} cy={n.y} r="3" fill={NEURAL_PATHS[i % NEURAL_PATHS.length].color} fillOpacity="0.12"
              style={{ animation: `neural-node-pulse ${2.5 + (i % 3) * 0.8}s ease-in-out infinite`, animationDelay: `${i * 0.22}s` }}
            />
            <circle cx={n.x} cy={n.y} r="6" fill="none" stroke={NEURAL_PATHS[i % NEURAL_PATHS.length].color} strokeOpacity="0.06" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Particle travelers (horizontal) */}
      {[
        { top: '17.2%', color: '#0c92e8', dur: 9, delay: 0 },
        { top: '52%',   color: '#D4FF3F', dur: 11, delay: 2.5 },
        { top: '83.9%', color: '#7c3aed', dur: 13, delay: 5 },
      ].map((p, i) => (
        <div key={`ph-${i}`} style={{
          position: 'absolute', top: p.top, left: 0,
          width: 5, height: 5, borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `particle-h ${p.dur}s linear infinite`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}

      {/* Particle travelers (vertical) */}
      {[
        { left: '8.7%',  color: '#0c92e8', dur: 10, delay: 1 },
        { left: '49.9%', color: '#D4FF3F', dur: 12, delay: 3.5 },
        { left: '91.5%', color: '#7c3aed', dur: 14, delay: 6 },
      ].map((p, i) => (
        <div key={`pv-${i}`} style={{
          position: 'absolute', top: 0, left: p.left,
          width: 5, height: 5, borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `particle-v ${p.dur}s linear infinite`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}

      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '4%', left: '6%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,146,232,0.07) 0%, transparent 70%)', animation: 'orb-float-1 14s ease-in-out infinite', filter: 'blur(24px)' }} />
      <div style={{ position: 'absolute', top: '8%', right: '4%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', animation: 'orb-float-2 17s ease-in-out infinite', filter: 'blur(24px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '25%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,255,63,0.04) 0%, transparent 70%)', animation: 'orb-float-1 20s ease-in-out infinite 5s', filter: 'blur(24px)' }} />
    </div>
  );
}

// ─── Hero Mockup ──────────────────────────────────────────────────────────────

function HeroMockup() {
  const [typedChars, setTypedChars] = useState(0);
  const [aiProgress, setAiProgress]   = useState(0);
  const [visibleTasks, setVisibleTasks] = useState(0);
  const [showFocus, setShowFocus]     = useState(false);
  const [timerSec, setTimerSec]       = useState(25 * 60);
  const [phase, setPhase]             = useState<'type' | 'process' | 'tasks' | 'focus'>('type');
  const [cycle, setCycle]             = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 2, y: -5 });

  useEffect(() => {
    if (phase !== 'focus') return;
    const id = setInterval(() => setTimerSec((p) => (p > 0 ? p - 1 : p)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[]   = [];
    const I: ReturnType<typeof setInterval>[]  = [];
    setTypedChars(0); setAiProgress(0); setVisibleTasks(0);
    setShowFocus(false); setTimerSec(25 * 60); setPhase('type');

    let ch = 0;
    const ti = setInterval(() => {
      ch++;
      setTypedChars(ch);
      if (ch >= DUMP_TEXT.length) {
        clearInterval(ti);
        setPhase('process');
        let p = 0;
        const pi = setInterval(() => {
          p += 2;
          setAiProgress(Math.min(Math.round(p), 100));
          if (p >= 100) {
            clearInterval(pi);
            setPhase('tasks');
            AI_TASKS.forEach((_, i) => T.push(setTimeout(() => setVisibleTasks(i + 1), (i + 1) * 440)));
            T.push(setTimeout(() => { setShowFocus(true); setPhase('focus'); }, AI_TASKS.length * 440 + 300));
            T.push(setTimeout(() => setCycle((c) => c + 1), AI_TASKS.length * 440 + 6500));
          }
        }, 22);
        I.push(pi);
      }
    }, 15);
    I.push(ti);
    return () => { T.forEach(clearTimeout); I.forEach(clearInterval); };
  }, [cycle]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    setTilt({ x: y * 8, y: -x * 10 });
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const mins = Math.floor(timerSec / 60);
  const secs = timerSec % 60;
  const R = 32, C = 2 * Math.PI * R;
  const timerOff = C * (1 - timerSec / (25 * 60));

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTilt({ x: 2, y: -5 })}
      className="relative w-full select-none"
      style={{
        transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease',
        maxWidth: 500, margin: '0 auto',
      }}
    >
      {/* Signal rings */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: `${100 + i * 15}%`, height: `${105 + i * 12}%`,
          borderRadius: '50%',
          border: `1px solid rgba(${i === 1 ? '12,146,232' : i === 2 ? '212,255,63' : '124,58,237'},0.08)`,
          animation: `signal-ring ${3 + i}s ease-out infinite`,
          animationDelay: `${(i - 1) * 1.1}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Ambient glow */}
      <div aria-hidden style={{ position: 'absolute', inset: -80, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 45%, rgba(12,146,232,0.2) 0%, rgba(124,58,237,0.1) 40%, transparent 70%)', filter: 'blur(36px)', pointerEvents: 'none' }} />

      {/* Glass card */}
      <div style={{ position: 'relative', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,7,7,0.97)', backdropFilter: 'blur(24px)', boxShadow: '0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)', padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>

        {/* Chrome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((c) => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4FF3F', display: 'inline-block', animation: 'glow-pulse 1.4s ease-in-out infinite', boxShadow: '0 0 8px #D4FF3F' }} />
            <span style={{ color: '#D4FF3F', letterSpacing: '0.08em' }}>LIVE AI</span>
          </div>
        </div>

        {/* Brain Dump */}
        <div style={{ borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)', padding: '11px 13px', position: 'relative', overflow: 'hidden' }}>
          {/* Scanning beam */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(12,146,232,0.55), rgba(212,255,63,0.3), transparent)', animation: 'scan-line 3.5s ease-in-out infinite', pointerEvents: 'none', zIndex: 2 }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: 7 }}>Brain Dump</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, color: '#cbd5e1', minHeight: 44, wordBreak: 'break-word', position: 'relative', zIndex: 1 }}>
            {DUMP_TEXT.slice(0, typedChars)}
            {typedChars < DUMP_TEXT.length && (
              <span style={{ display: 'inline-block', width: 2, height: 12, background: '#0c92e8', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink-cursor 0.75s step-end infinite' }} />
            )}
          </div>
          {aiProgress > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={9} /> MindPad AI is extracting tasks...
                </span>
                <span style={{ fontSize: 9, color: '#4b5563' }}>{aiProgress}%</span>
              </div>
              <div style={{ height: 2.5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${aiProgress}%`, borderRadius: 99, background: 'linear-gradient(90deg, #0c92e8, #7c3aed, #D4FF3F)', transition: 'width 0.04s linear', boxShadow: '0 0 8px rgba(124,58,237,0.6)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Tasks + Timer row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 9 }}>
          <div style={{ borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)', padding: '11px 13px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: 7 }}>AI Tasks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleTasks === 0 && <p style={{ fontSize: 10, color: '#1e293b', fontStyle: 'italic' }}>Awaiting extraction...</p>}
              {AI_TASKS.slice(0, visibleTasks).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 7px', animation: 'slide-in-right 0.3s ease forwards' }}>
                  <CheckCircle2 size={10} color={t.color} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 10, color: '#e2e8f0' }}>{t.text}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: `${t.color}20`, color: t.color, flexShrink: 0 }}>{t.priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 7 }}>Timer</div>
            <div style={{ position: 'relative', width: 62, height: 62 }}>
              <svg viewBox="0 0 76 76" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="38" cy="38" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
                <circle cx="38" cy="38" r={R} stroke={phase === 'focus' ? '#D4FF3F' : 'rgba(212,255,63,0.2)'} strokeWidth="5" fill="none" strokeDasharray={C} strokeDashoffset={phase === 'focus' ? timerOff : C * 0.85} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: phase === 'focus' ? 'drop-shadow(0 0 4px #D4FF3F)' : 'none' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: phase === 'focus' ? '#D4FF3F' : '#374151', letterSpacing: '-0.02em' }}>{pad(mins)}:{pad(secs)}</span>
              </div>
            </div>
            <span style={{ fontSize: 8, color: phase === 'focus' ? '#D4FF3F' : '#374151', marginTop: 4, fontWeight: 600 }}>
              {phase === 'focus' ? '● Running' : '○ Ready'}
            </span>
          </div>
        </div>

        {/* Focus recommendation */}
        {showFocus && (
          <div style={{ borderRadius: 11, border: '1px solid rgba(12,146,232,0.3)', background: 'rgba(12,146,232,0.07)', padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 8, animation: 'fade-in 0.4s ease forwards' }}>
            <Target size={12} color="#0c92e8" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#7cc8fb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Focus First</p>
              <p style={{ fontSize: 10.5, color: '#cbd5e1' }}>Refine landing page — unblocks launch</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, background: '#D4FF3F', color: '#0a0a0a', fontSize: 9, fontWeight: 700 }}>
              <Play size={8} fill="#0a0a0a" /> Start
            </div>
          </div>
        )}

        {/* Analytics row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, borderRadius: 11, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.35)', padding: '9px 13px' }}>
          {[{ label: 'Focus Score', val: '87%', c: '#D4FF3F' }, { label: 'Captured', val: '12', c: '#0c92e8' }, { label: 'Done', val: '4', c: '#4ade80' }].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: s.c, fontFamily: 'monospace', lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: 8.5, color: '#374151', marginTop: 3 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Floating mini-cards ──────────────────────────────────────────────────────

function FloatCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div style={{
      position: 'absolute',
      backdropFilter: 'blur(16px)',
      background: 'rgba(10,10,10,0.88)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '8px 12px',
      fontSize: 11,
      color: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      zIndex: 10,
      ...style,
    }} className={className}>
      {children}
    </div>
  );
}

// ─── Hero Scene ───────────────────────────────────────────────────────────────

const INPUT_ITEMS = [
  { label: 'finish landing page', color: '#0c92e8' },
  { label: 'review job applications', color: '#7c3aed' },
  { label: "prepare tomorrow's focus", color: '#0c92e8' },
  { label: 'send proposal follow-up', color: '#D4FF3F' },
  { label: 'clean inbox', color: '#7c3aed' },
];

const BOARD_TASKS = [
  { label: 'Refine landing page', tag: 'HIGH', color: '#f87171' },
  { label: 'Send proposal follow-up', tag: 'HIGH', color: '#f87171' },
  { label: 'Review 3 applications', tag: 'MED', color: '#fbbf24' },
  { label: "Plan tomorrow's priority", tag: 'MED', color: '#fbbf24' },
];

const LEFT_PATHS = [
  { d: 'M 108,82 C 124,82 124,178 140,178',  color: '#0c92e8', dur: 2.2, delay: 0 },
  { d: 'M 108,122 C 124,122 124,178 140,178', color: '#7c3aed', dur: 2.6, delay: 0.5 },
  { d: 'M 108,162 C 124,162 124,178 140,178', color: '#0c92e8', dur: 2.0, delay: 1.0 },
  { d: 'M 108,202 C 124,202 124,178 140,178', color: '#D4FF3F', dur: 2.8, delay: 1.4 },
  { d: 'M 108,242 C 124,242 124,178 140,178', color: '#7c3aed', dur: 2.4, delay: 0.8 },
];

const RIGHT_PATHS = [
  { d: 'M 362,178 C 378,178 378,90 394,90',   color: '#f87171', dur: 2.1, delay: 1.6 },
  { d: 'M 362,178 C 378,178 378,138 394,138',  color: '#f87171', dur: 2.5, delay: 2.0 },
  { d: 'M 362,178 C 378,178 378,188 394,188',  color: '#fbbf24', dur: 2.3, delay: 2.4 },
  { d: 'M 362,178 C 378,178 378,238 394,238',  color: '#4ade80', dur: 2.7, delay: 2.8 },
];

function HeroScene() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, []);
  const activeInput = tick % INPUT_ITEMS.length;

  return (
    <div className="relative w-full select-none" style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* Ambient glow */}
      <div aria-hidden style={{ position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 45%, rgba(12,146,232,0.14) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Scene container */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '78%' }}>
        <svg
          viewBox="0 0 502 390"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Dotted grid */}
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.045)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="502" height="390" fill="url(#hero-dots)" />

          {/* ── Left: Input cards ── */}
          {INPUT_ITEMS.map((item, i) => (
            <g key={i}>
              <rect
                x="0" y={60 + i * 48} width="108" height="34" rx="7"
                fill={activeInput === i ? 'rgba(12,146,232,0.12)' : 'rgba(255,255,255,0.04)'}
                stroke={activeInput === i ? item.color : 'rgba(255,255,255,0.08)'}
                strokeWidth="0.8"
                style={{ transition: 'fill 0.4s, stroke 0.4s' }}
              />
              <circle cx="10" cy={60 + i * 48 + 17} r="3" fill={item.color} fillOpacity={activeInput === i ? 1 : 0.3} />
              <text x="18" y={60 + i * 48 + 21} fill={activeInput === i ? '#e2e8f0' : '#475569'} fontSize="7.5" style={{ transition: 'fill 0.4s' }}>
                {item.label}
              </text>
            </g>
          ))}

          {/* ── Left connector paths + particles ── */}
          {LEFT_PATHS.map((p, i) => (
            <g key={`lp-${i}`}>
              <path d={p.d} stroke={p.color} strokeOpacity="0.18" strokeWidth="1" fill="none" strokeDasharray="4 14"
                style={{ animation: `dash-flow ${p.dur * 3}s linear infinite`, animationDelay: `${p.delay * -1}s` }}
              />
              <circle r="2.5" fill={p.color} style={{
                offsetPath: `path('${p.d}')`,
                offsetDistance: '0%',
                animation: `particle-move ${p.dur}s linear infinite`,
                animationDelay: `${p.delay}s`,
                boxShadow: `0 0 6px ${p.color}`,
              } as React.CSSProperties} />
            </g>
          ))}

          {/* ── Center: AI card ── */}
          <rect x="140" y="128" width="222" height="100" rx="12"
            fill="rgba(7,7,7,0.97)"
            stroke="rgba(12,146,232,0.35)"
            strokeWidth="1"
          />
          {/* Glow behind center card */}
          <ellipse cx="251" cy="178" rx="90" ry="50" fill="rgba(12,146,232,0.07)" />

          {/* AI card header */}
          <circle cx="155" cy="142" r="3" fill="#ff5f57" />
          <circle cx="164" cy="142" r="3" fill="#ffbd2e" />
          <circle cx="173" cy="142" r="3" fill="#28c840" />
          <circle cx="340" cy="142" r="3.5" fill="#D4FF3F" style={{ animation: 'glow-pulse 1.4s ease-in-out infinite' }} />
          <text x="350" y="146" fill="#D4FF3F" fontSize="7" fontWeight="700" letterSpacing="0.08">LIVE AI</text>

          {/* Brain icon representation */}
          <circle cx="220" cy="176" r="14" fill="rgba(12,146,232,0.12)" stroke="rgba(12,146,232,0.3)" strokeWidth="0.8" />
          <text x="215" y="181" fill="#0c92e8" fontSize="13">🧠</text>

          {/* AI dots loader */}
          <g>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={244 + i * 9} cy="176" r="2.5" fill="#7c3aed"
                style={{ animation: `ai-dots 1.4s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </g>

          <text x="148" y="204" fill="#475569" fontSize="7.5">MindPad AI is structuring your thoughts</text>

          {/* Progress bar inside AI card */}
          <rect x="148" y="212" width="186" height="2.5" rx="1.5" fill="rgba(255,255,255,0.05)" />
          <rect x="148" y="212" width="0" height="2.5" rx="1.5"
            fill="url(#ai-progress-grad)"
            style={{ animation: 'progress-fill 2.8s ease-in-out infinite alternate' }}
          />
          <defs>
            <linearGradient id="ai-progress-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0c92e8" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#D4FF3F" />
            </linearGradient>
          </defs>

          {/* ── Right connector paths + particles ── */}
          {RIGHT_PATHS.map((p, i) => (
            <g key={`rp-${i}`}>
              <path d={p.d} stroke={p.color} strokeOpacity="0.18" strokeWidth="1" fill="none" strokeDasharray="4 14"
                style={{ animation: `dash-flow ${p.dur * 3}s linear infinite`, animationDelay: `${p.delay * -1}s` }}
              />
              <circle r="2.5" fill={p.color} style={{
                offsetPath: `path('${p.d}')`,
                offsetDistance: '0%',
                animation: `particle-move ${p.dur}s linear infinite`,
                animationDelay: `${p.delay}s`,
              } as React.CSSProperties} />
            </g>
          ))}

          {/* ── Right: Workflow board ── */}
          <rect x="394" y="60" width="108" height="260" rx="9"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
          />
          <text x="402" y="78" fill="#475569" fontSize="7" fontWeight="700" letterSpacing="0.1">TASK BOARD</text>
          <line x1="394" y1="84" x2="502" y2="84" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {BOARD_TASKS.map((task, i) => (
            <g key={i}>
              <rect x="400" y={92 + i * 54} width="96" height="44" rx="5"
                fill={i === 0 ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)'}
                stroke={i === 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)'}
                strokeWidth="0.6"
              />
              <circle cx="408" cy={92 + i * 54 + 12} r="2.5" fill={task.color} fillOpacity="0.7" />
              <text x="415" y={92 + i * 54 + 16} fill="#94a3b8" fontSize="6.8">
                {task.label.length > 14 ? task.label.slice(0, 14) + '…' : task.label}
              </text>
              <rect x="400" y={92 + i * 54 + 26} width="28" height="10" rx="3" fill={`${task.color}22`} />
              <text x="404" y={92 + i * 54 + 34} fill={task.color} fontSize="6" fontWeight="700">{task.tag}</text>
            </g>
          ))}

          {/* Completion tick on last board item */}
          <circle cx="488" cy="310" r="8" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.3)" strokeWidth="0.7" />
          <text x="483" y="314" fill="#4ade80" fontSize="9">✓</text>
        </svg>
      </div>

      {/* Stats row below scene */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        {[
          { label: 'Focus Score', val: '87%', color: '#D4FF3F' },
          { label: 'Tasks captured', val: '12', color: '#0c92e8' },
          { label: 'Completed today', val: '4', color: '#4ade80' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#FAFAFA] overflow-x-hidden">
      <NeuralBackground />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030303]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0c92e8]/10 text-[#0c92e8] ring-1 ring-[#0c92e8]/20">
              <Brain size={18} />
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              MindPad
              <span className="rounded-full border border-[#0c92e8]/30 bg-[#0c92e8]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#0c92e8]">AI</span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 lg:flex text-sm text-[#94a3b8]">
            <Link href="#how-it-works" className="transition hover:text-white">How it works</Link>
            <Link href="#features" className="transition hover:text-white">Features</Link>
            <Link href="#pricing" className="transition hover:text-white">Pricing</Link>
            <Link href="#faq" className="transition hover:text-white">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-[#94a3b8] transition hover:text-white">Login</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#D4FF3F] px-4 py-2 text-sm font-bold text-[#08120a] transition hover:bg-[#c5f52e] hover:shadow-[0_0_20px_rgba(212,255,63,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative" style={{ zIndex: 1 }}>

        {/* ── 1. HERO ── */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid gap-14 lg:grid-cols-2 items-center">

            {/* Left copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D4FF3F]/25 bg-[#D4FF3F]/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D4FF3F] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4FF3F]">AI Productivity Workspace</span>
              </div>

              <h1 className="text-5xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl">
                Turn scattered thoughts into{' '}
                <span style={{ background: 'linear-gradient(135deg, #D4FF3F 0%, #0c92e8 55%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  focused execution
                </span>
              </h1>

              <p className="max-w-lg text-lg leading-8 text-[#94a3b8]">
                MindPad AI captures messy brain dumps, extracts actionable tasks, recommends what to focus on first, and helps you track progress.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#D4FF3F] px-6 py-3 text-sm font-bold text-[#08120a] transition hover:bg-[#c5f52e] hover:shadow-[0_0_30px_rgba(212,255,63,0.3)]">
                  Start for free <ArrowRight size={15} />
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-[#e2e8f0] transition hover:border-white/25 hover:bg-white/10">
                  See how it works <ArrowRight size={15} />
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { label: 'Free forever', sub: 'Core AI workflow included' },
                  { label: 'No credit card', sub: 'Start immediately' },
                  { label: 'Built for focus', sub: 'Designed for deep work' },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <CheckCircle2 size={14} color="#D4FF3F" />
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[11px] text-[#475569]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: HeroScene (desktop) / HeroMockup (mobile) */}
            <div className="relative">
              <div className="hidden lg:block">
                <HeroScene />
              </div>
              <div className="lg:hidden" style={{ animation: 'float-gentle 6s ease-in-out infinite' }}>
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. SMARTER WAY ── */}
        <section className="border-y border-white/10 bg-[#040404] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">There&apos;s a smarter way</p>
              <h2 className="text-4xl font-bold tracking-tight text-white">
                <RevealWords text="Stop managing chaos. Start executing." />
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-[#64748b]">
                Most people juggle scattered notes, forgotten tasks, and unclear priorities. MindPad replaces that with one intelligent workflow.
              </p>
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_52px_1fr]">

              {/* Old way */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                    <X size={15} color="#ef4444" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#64748b]">Without MindPad</h3>
                </div>
                <div className="space-y-2.5">
                  {['Scattered notes across multiple apps', 'Forgotten tasks and missed deadlines', 'Switching between 5 different tools', 'Unclear what to work on first', 'No visibility into your progress', 'Mental overhead kills deep focus'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10">
                        <X size={9} color="#ef4444" />
                      </div>
                      <span className="text-sm text-[#475569] line-through decoration-[#374151]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transformation beam */}
              <div className="hidden flex-col items-center justify-center lg:flex">
                <div className="relative flex flex-col items-center" style={{ height: '100%' }}>
                  <div style={{ flex: 1, width: 2, background: 'linear-gradient(to bottom, transparent, rgba(12,146,232,0.3), rgba(212,255,63,0.5), rgba(124,58,237,0.3), transparent)', position: 'relative' }}>
                    {/* Traveling particle */}
                    <div style={{ position: 'absolute', left: -3, width: 8, height: 8, borderRadius: '50%', background: '#D4FF3F', boxShadow: '0 0 10px #D4FF3F', animation: 'beam-particle 2.8s ease-in-out infinite' }} />
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(212,255,63,0.3)', background: 'rgba(212,255,63,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '8px 0' }}>
                    <Sparkles size={13} color="#D4FF3F" />
                  </div>
                  <div style={{ flex: 1, width: 2, background: 'linear-gradient(to bottom, transparent, rgba(212,255,63,0.5), rgba(12,146,232,0.3), transparent)' }} />
                </div>
              </div>

              {/* MindPad way */}
              <div className="rounded-2xl border border-[#D4FF3F]/15 bg-[#080808] p-7" style={{ boxShadow: '0 0 50px rgba(212,255,63,0.05)' }}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4FF3F]/10">
                    <Sparkles size={15} color="#D4FF3F" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#D4FF3F]">With MindPad AI</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { text: 'One brain dump captures everything', accent: '#D4FF3F' },
                    { text: 'AI extracts and structures tasks for you', accent: '#0c92e8' },
                    { text: 'Single focused workspace, zero switching', accent: '#7c3aed' },
                    { text: 'AI recommends exactly what to do first', accent: '#D4FF3F' },
                    { text: 'Focus sessions track real progress', accent: '#4ade80' },
                    { text: 'Analytics show streaks and momentum', accent: '#38bdf8' },
                  ].map(({ text, accent }) => (
                    <div key={text} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/10">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ background: `${accent}18` }}>
                        <CheckCircle2 size={11} color={accent} />
                      </div>
                      <span className="text-sm text-[#e2e8f0]">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. HOW IT WORKS ── */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">From brain dump to done</p>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              <RevealWords text="How it works" />
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#64748b]">Five steps that turn your messy mind into clear, focused execution.</p>
          </div>

          <div className="relative">
            {/* Connector line + traveling dot */}
            <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,255,63,0.12), rgba(12,146,232,0.12), rgba(212,255,63,0.12), transparent)', zIndex: 0 }}>
              <div style={{ position: 'absolute', top: -4, left: 0, width: 10, height: 10, borderRadius: '50%', background: '#D4FF3F', boxShadow: '0 0 10px #D4FF3F', animation: 'step-dot 5s ease-in-out infinite' }} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5" style={{ position: 'relative', zIndex: 1 }}>
              {STEPS.map(({ n, icon: Icon, title, desc, accent }, idx) => (
                <div key={n} className="group relative rounded-2xl border border-white/10 bg-[#080808] p-6 transition-all duration-200 hover:-translate-y-1.5" style={{ boxShadow: 'none' }}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}15` }}>
                      <Icon size={18} style={{ color: accent }} />
                    </div>
                    <span className="text-2xl font-black" style={{ color: `${accent}28` }}>{n}</span>
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-5 text-[#475569]">{desc}</p>
                  <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${accent}30` }} />
                  <div className="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. LIVE PRODUCT FLOW ── */}
        <section className="border-y border-white/10 bg-[#040404] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">See it in action</p>
              <h2 className="text-4xl font-bold tracking-tight text-white">
              <RevealWords text="The full workflow" />
            </h2>
              <p className="mt-4 text-base text-[#64748b]">One flow from messy thoughts to measurable progress.</p>
            </div>

            {/* Flow label row */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              {['Brain Dump', 'AI Extract', 'Focus First', 'Focus Timer', 'Progress'].map((label, i) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[#64748b]">{label}</span>
                  {i < 4 && <ArrowRight size={12} color="#374151" />}
                </span>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              {/* 1. Brain Dump */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0c92e8]/30 hover:shadow-[0_0_20px_rgba(12,146,232,0.06)]">
                <div className="mb-4 flex items-center gap-2">
                  <Brain size={13} color="#0c92e8" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0c92e8]">Brain Dump</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#030303] p-3 font-mono text-[11px] leading-5 text-[#64748b]">
                  &quot;finish landing page, send proposal, review job applications, prepare tomorrow&apos;s focus list, clean inbox&quot;
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-[#374151]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c92e8]" />
                  Raw thoughts captured
                </div>
              </div>

              {/* 2. AI Extract */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7c3aed]/30 hover:shadow-[0_0_20px_rgba(124,58,237,0.06)]">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={13} color="#7c3aed" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c3aed]">AI Extract</span>
                </div>
                <div className="space-y-1.5">
                  {[['Refine landing page','#f87171'],['Send proposal follow-up','#f87171'],['Review 3 applications','#fbbf24'],['Plan tomorrow','#fbbf24'],['Clean inbox','#4ade80']].map(([t,c]) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#030303] px-2.5 py-1.5">
                      <CheckCircle2 size={10} color={c} />
                      <span className="text-[10px] text-[#94a3b8]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Focus First */}
              <div className="rounded-2xl border border-[#D4FF3F]/15 bg-[#080808] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4FF3F]/30 hover:shadow-[0_0_20px_rgba(212,255,63,0.06)]">
                <div className="mb-4 flex items-center gap-2">
                  <Target size={13} color="#D4FF3F" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4FF3F]">Focus First</span>
                </div>
                <div className="rounded-lg border border-[#D4FF3F]/12 bg-[#D4FF3F]/5 p-3">
                  <p className="mb-1.5 text-[10px] font-semibold text-[#D4FF3F]">AI Recommendation</p>
                  <p className="text-[11px] leading-5 text-[#e2e8f0]">&quot;Start with the task that unblocks launch.&quot;</p>
                </div>
                <div className="mt-3 rounded-lg border border-white/5 bg-[#030303] px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-white">→ Refine landing page</p>
                  <p className="mt-0.5 text-[9px] text-[#475569]">Priority: HIGH · Unblocks launch</p>
                </div>
              </div>

              {/* 4. Timer */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#38bdf8]/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.06)]">
                <div className="mb-4 flex items-center gap-2">
                  <Timer size={13} color="#38bdf8" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#38bdf8]">Focus Timer</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative h-20 w-20">
                    <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
                      <circle cx="40" cy="40" r="34" stroke="#38bdf8" strokeWidth="5" fill="none" strokeDasharray={2*Math.PI*34} strokeDashoffset={2*Math.PI*34*0.35} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px #38bdf8)' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-base font-bold text-[#38bdf8]">17:23</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#475569]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#38bdf8]" />Session running
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/5 bg-[#030303] px-2.5 py-2 text-[10px] text-[#475569]">25 min · Refine landing page</div>
              </div>

              {/* 5. Progress */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4ade80]/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.06)]">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 size={13} color="#4ade80" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4ade80]">Progress</span>
                </div>
                <div className="space-y-2.5">
                  {[{ label: 'Focus Score', val: '87%', color: '#D4FF3F', w: 87 }, { label: 'Tasks Captured', val: '12', color: '#0c92e8', w: 75 }, { label: 'Completed', val: '4', color: '#4ade80', w: 33 }].map((s) => (
                    <div key={s.label}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span style={{ color: '#64748b' }}>{s.label}</span>
                        <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5">
                        <div className="h-full rounded-full" style={{ width: `${s.w}%`, background: s.color, boxShadow: `0 0 6px ${s.color}60` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. FEATURES ── */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">Everything you need</p>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              <RevealWords text="Built for deep work" />
            </h2>
            <p className="mt-4 text-base text-[#64748b]">Every feature is designed to reduce friction and maximize focus.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group relative rounded-2xl border border-white/10 bg-[#080808] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#D4FF3F]/20 hover:shadow-[0_0_24px_rgba(212,255,63,0.06)]">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4FF3F]/8 transition duration-200 group-hover:bg-[#D4FF3F]/15">
                  <Icon size={19} color="#D4FF3F" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                <p className="text-xs leading-5 text-[#475569]">{desc}</p>
                <div className="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,255,63,0.3), transparent)' }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. PRICING ── */}
        <section id="pricing" className="border-y border-white/10 bg-[#040404] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            {/* Pricing glow */}
            <div aria-hidden style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(212,255,63,0.04) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div className="mb-14 text-center relative">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">Simple, transparent</p>
              <h2 className="text-4xl font-bold tracking-tight text-white">
                <RevealWords text="Start free. Scale when ready." />
              </h2>
              <p className="mt-4 text-base text-[#64748b]">The full core workflow is free forever.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 relative">
              {/* Free — active with neon border */}
              <div
                className="relative rounded-2xl bg-[#080808] p-8"
                style={{ border: '1px solid rgba(212,255,63,0.3)', animation: 'neon-border-pulse 2.8s ease-in-out infinite' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-[#D4FF3F]/40 bg-[#030303] px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4FF3F]">Recommended</span>
                </div>
                <div className="mt-2 mb-2 flex items-end gap-1.5">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="mb-1.5 text-sm text-[#475569]">/ forever</span>
                </div>
                <p className="mb-6 text-sm font-bold text-[#D4FF3F]">Free</p>
                <div className="mb-8 space-y-3">
                  {['Brain Dump', 'AI task extraction', 'Task management', 'Focus timer', 'Basic analytics'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-[#e2e8f0]">
                      <CheckCircle2 size={14} color="#D4FF3F" /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/register" className="block w-full rounded-xl bg-[#D4FF3F] py-3 text-center text-sm font-bold text-[#08120a] transition hover:bg-[#c5f52e] hover:shadow-[0_0_20px_rgba(212,255,63,0.3)]">
                  Start for free
                </Link>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-8 transition-all duration-200 hover:border-[#7c3aed]/30">
                <div className="mb-2 flex items-end gap-1.5">
                  <span className="text-4xl font-black text-white">$9</span>
                  <span className="mb-1.5 text-sm text-[#475569]">/ month</span>
                </div>
                <p className="mb-1 text-sm font-bold text-[#7c3aed]">Pro</p>
                <p className="mb-6 text-xs text-[#374151]">Coming soon · Join preview</p>
                <div className="mb-8 space-y-3">
                  {['Advanced analytics', 'Daily planning', 'Full focus history', 'Priority insights', 'Export & integrations'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-[#64748b]">
                      <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-[#374151]" /> {f}
                    </div>
                  ))}
                </div>
                <button disabled className="w-full cursor-not-allowed rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-[#374151]">
                  Coming soon
                </button>
              </div>

              {/* Team */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-8 transition-all duration-200 hover:border-[#38bdf8]/20">
                <div className="mb-2">
                  <span className="text-4xl font-black text-[#374151]">Team</span>
                </div>
                <p className="mb-1 text-sm font-bold text-[#38bdf8]">Teams</p>
                <p className="mb-6 text-xs text-[#374151]">Coming soon</p>
                <div className="mb-8 space-y-3">
                  {['Shared workspaces', 'Team productivity insights', 'Collaboration workflows', 'Admin controls', 'Priority support'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-[#374151]">
                      <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-[#1e293b]" /> {f}
                    </div>
                  ))}
                </div>
                <button disabled className="w-full cursor-not-allowed rounded-xl border border-white/5 py-3 text-center text-sm font-semibold text-[#1e293b]">
                  Coming soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
        <section id="faq" className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#475569]">Got questions?</p>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              <RevealWords text="Frequently asked" />
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="group rounded-2xl border border-white/10 bg-[#080808] p-6 transition-all duration-200 hover:border-[#D4FF3F]/15 hover:shadow-[0_0_20px_rgba(212,255,63,0.04)]">
                <div className="mb-3 flex items-start gap-3">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4FF3F] opacity-60 transition-opacity duration-200 group-hover:opacity-100" style={{ marginTop: 6 }} />
                  <h3 className="text-sm font-bold text-white">{q}</h3>
                </div>
                <p className="pl-4 text-sm leading-6 text-[#64748b]">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. FINAL CTA ── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="relative overflow-hidden rounded-2xl border border-[#D4FF3F]/15 bg-[#070707] p-14" style={{ boxShadow: '0 0 80px rgba(212,255,63,0.06)' }}>
              {/* Animated radial glows */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div style={{ position: 'absolute', top: '-60%', left: '-20%', width: '70%', height: '180%', background: 'radial-gradient(ellipse, rgba(212,255,63,0.06) 0%, transparent 60%)', animation: 'cta-glow 4s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '60%', height: '140%', background: 'radial-gradient(ellipse, rgba(12,146,232,0.05) 0%, transparent 60%)', animation: 'cta-glow 4s ease-in-out infinite 2s' }} />
                <div style={{ position: 'absolute', bottom: '-40%', left: '20%', width: '60%', height: '100%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.04) 0%, transparent 60%)', animation: 'cta-glow 5s ease-in-out infinite 1s' }} />
              </div>

              {/* Floating signal cards */}
              <div className="hidden lg:block">
                <div style={{ position: 'absolute', top: 20, left: 20, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(212,255,63,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', fontSize: 10, color: '#D4FF3F', fontWeight: 700, animation: 'float-card-1 5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
                  <span style={{ marginRight: 5 }}>●</span>Brain Dump ready
                </div>
                <div style={{ position: 'absolute', bottom: 20, right: 20, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(12,146,232,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', fontSize: 10, color: '#0c92e8', fontWeight: 700, animation: 'float-card-2 6s ease-in-out infinite 1s', whiteSpace: 'nowrap' }}>
                  <span style={{ marginRight: 5 }}>●</span>AI signal active
                </div>
              </div>

              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4FF3F]/10">
                  <Zap size={22} color="#D4FF3F" />
                </div>
                <h2 className="mb-4 text-4xl font-black tracking-tight text-white">
                  Clear your mind.<br />Start with one brain dump.
                </h2>
                <p className="mx-auto mb-8 max-w-md text-base text-[#64748b]">
                  Turn scattered thoughts into a focused next action in seconds.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#D4FF3F] px-7 py-3.5 text-sm font-bold text-[#08120a] transition hover:bg-[#c5f52e] hover:shadow-[0_0_30px_rgba(212,255,63,0.3)]">
                    Start for free <ArrowRight size={15} />
                  </Link>
                  <Link href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-[#e2e8f0] transition hover:border-white/25 hover:bg-white/10">
                    See how it works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Brain size={16} color="#0c92e8" />
              <span className="text-sm font-bold text-[#475569]">MindPad AI</span>
            </div>
            <p className="text-xs text-[#1e293b]">AI productivity workspace for focused execution.</p>
            <div className="flex gap-5 text-xs text-[#374151]">
              <Link href="/login" className="transition hover:text-[#64748b]">Login</Link>
              <Link href="/register" className="transition hover:text-[#64748b]">Sign up</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
