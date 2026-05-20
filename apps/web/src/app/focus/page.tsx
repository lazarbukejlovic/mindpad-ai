'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Play, Pause, RotateCcw, CheckCircle2, Flame, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { FocusSession, Task } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import NeuralBackground from '@/components/ui/NeuralBackground';

type Phase = 'setup' | 'running' | 'paused' | 'completed';

const DURATIONS = [
  { label: '25 min', value: 25 },
  { label: '50 min', value: 50 },
  { label: '90 min', value: 90 },
];

const priorityVariant = { high: 'danger', medium: 'warning', low: 'success' } as const;

function pad(n: number) { return n.toString().padStart(2, '0'); }

function TimerRing({ progress, phase }: { progress: number; phase: Phase }) {
  const r    = 90;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const glowColor = phase === 'running'
    ? 'rgba(0, 160, 255, 0.55)'
    : phase === 'paused'
    ? 'rgba(255, 185, 0, 0.4)'
    : 'rgba(0, 160, 255, 0.2)';

  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00c8ff" />
          <stop offset="100%" stopColor="#0060e0" />
        </linearGradient>
        <filter id="timerGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <circle cx="100" cy="100" r={r}
        stroke="rgba(0,80,160,0.2)" strokeWidth="10" fill="none" />
      {/* Progress arc glow */}
      <circle cx="100" cy="100" r={r}
        stroke={glowColor} strokeWidth="14" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" filter="url(#timerGlow)"
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }} />
      {/* Progress arc sharp */}
      <circle cx="100" cy="100" r={r}
        stroke="url(#timerGrad)" strokeWidth="8" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
    </svg>
  );
}

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1rem',
};

export default function FocusPage() {
  const router = useRouter();
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [sessions, setSessions]         = useState<FocusSession[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | undefined>();
  const [duration, setDuration]         = useState(25);
  const [phase, setPhase]               = useState<Phase>('setup');
  const [secondsLeft, setSecondsLeft]   = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [dataLoading, setDataLoading]   = useState(true);
  const [starting, setStarting]         = useState(false);
  const [sessionError, setSessionError] = useState('');
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!getToken()) { setDataLoading(false); router.push('/login'); return; }
    loadData();
  }, [router]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setPhase('completed');
            if (sessionIdRef.current) {
              ApiClient.completeFocusSession(sessionIdRef.current)
                .then(() => loadData())
                .catch((err: unknown) => {
                  setSessionError(err instanceof Error ? err.message : 'Could not save session');
                });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  async function loadData() {
    try {
      const [tasksData, sessionsData] = await Promise.all([ApiClient.getTasks(), ApiClient.getFocusSessions()]);
      setTasks((tasksData as Task[]).filter(t => !t.completed));
      setSessions(sessionsData as FocusSession[]);
    } catch { /* silent */ }
    finally { setDataLoading(false); }
  }

  async function handleStart() {
    setStarting(true);
    try {
      const session = await ApiClient.createFocusSession({ taskId: selectedTask, duration });
      sessionIdRef.current = session.id;
      setSecondsLeft(duration * 60); setTotalSeconds(duration * 60); setPhase('running');
    } catch { /* silent */ }
    finally { setStarting(false); }
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (sessionIdRef.current) {
      ApiClient.deleteFocusSession(sessionIdRef.current).catch(() => {});
      sessionIdRef.current = null;
    }
    setSecondsLeft(duration * 60); setTotalSeconds(duration * 60); setPhase('setup');
  }

  function handleDurationChange(val: number) {
    if (phase === 'setup') { setDuration(val); setSecondsLeft(val * 60); setTotalSeconds(val * 60); }
  }

  const minutes   = Math.floor(secondsLeft / 60);
  const seconds   = secondsLeft % 60;
  const progress  = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const selectedTaskObj    = tasks.find(t => t.id === selectedTask);
  const completedSessions  = sessions.filter(s => s.completed);
  const totalFocusMinutes  = completedSessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

            {sessionError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 12, marginBottom: 20, background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', fontSize: 13,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{sessionError}</span>
                <button onClick={() => setSessionError('')} style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,120,255,0.15)',
                }}>
                  <Timer size={22} style={{ color: '#40b8ff' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3,
                  }}>Focus</h1>
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>
                    {completedSessions.length} sessions · {totalFocusMinutes} min total
                  </p>
                </div>
              </div>
              {completedSessions.length >= 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ffb700' }}>
                  <Flame size={15} />
                  {completedSessions.length} sessions done
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 24 }} className="md:grid-cols-5">
              {/* ── Timer Column ── */}
              <div style={{ ...panel, gridColumn: 'span 3', padding: '32px 24px' }} className="md:col-span-3">
                {phase === 'completed' ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    {/* Success state */}
                    <div style={{
                      width: 84, height: 84, borderRadius: '50%', margin: '0 auto 20px',
                      background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 30px rgba(22,163,74,0.15)',
                    }}>
                      <CheckCircle2 size={38} style={{ color: '#22c55e' }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(200,220,245,0.95)', marginBottom: 10, letterSpacing: '-0.02em' }}>
                      Session Complete!
                    </h2>
                    <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.85)', marginBottom: 4 }}>
                      You focused for <span style={{ fontWeight: 700, color: 'rgba(200,220,245,0.9)' }}>{duration} minutes</span>.
                    </p>
                    {selectedTaskObj && (
                      <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)', marginBottom: 6 }}>
                        Working on: <span style={{ fontWeight: 600, color: 'rgba(180,210,240,0.85)' }}>{selectedTaskObj.title}</span>
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: 'rgba(70,100,140,0.65)', marginBottom: 24 }}>
                      Take a short break before your next session.
                    </p>
                    <Button onClick={handleReset}>Start New Session</Button>
                  </div>
                ) : (
                  <>
                    {/* Duration selector */}
                    {phase === 'setup' && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                        {DURATIONS.map(d => (
                          <button key={d.value} onClick={() => handleDurationChange(d.value)} style={{
                            padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s', border: 'none',
                            background: duration === d.value
                              ? 'linear-gradient(135deg, #0080d8, #0055a8)'
                              : 'rgba(0,80,160,0.12)',
                            color: duration === d.value ? '#fff' : 'rgba(100,150,200,0.8)',
                            boxShadow: duration === d.value ? '0 4px 16px rgba(0,100,220,0.3)' : 'none',
                          }}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Phase badge */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <Badge variant={phase === 'running' ? 'info' : phase === 'paused' ? 'warning' : 'default'}>
                        {phase === 'setup' ? 'Ready' : phase === 'running' ? 'Focusing' : 'Paused'}
                      </Badge>
                    </div>

                    {/* Timer ring */}
                    <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 28px' }}>
                      {/* Ambient glow behind ring */}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: phase === 'running'
                          ? 'radial-gradient(circle, rgba(0,140,255,0.12) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(0,80,160,0.06) 0%, transparent 70%)',
                        transition: 'background 0.5s',
                        pointerEvents: 'none',
                      }} />
                      <TimerRing progress={progress} phase={phase} />
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: 44, fontWeight: 800,
                          color: phase === 'paused' ? '#ffb700' : 'rgba(200,230,255,0.95)',
                          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                          transition: 'color 0.3s',
                        }}>
                          {pad(minutes)}:{pad(seconds)}
                        </span>
                        {phase !== 'setup' && selectedTaskObj && (
                          <span style={{
                            fontSize: 11, color: 'rgba(90,120,160,0.75)',
                            marginTop: 4, maxWidth: 140, textAlign: 'center',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {selectedTaskObj.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                      {phase === 'setup' && (
                        <Button onClick={handleStart} loading={starting || dataLoading} size="lg">
                          <Play size={16} fill="currentColor" /> Start Session
                        </Button>
                      )}
                      {phase === 'running' && (
                        <>
                          <Button onClick={() => setPhase('paused')} size="lg">
                            <Pause size={16} fill="currentColor" /> Pause
                          </Button>
                          <Button variant="ghost" onClick={handleReset} size="lg">
                            <RotateCcw size={16} /> Reset
                          </Button>
                        </>
                      )}
                      {phase === 'paused' && (
                        <>
                          <Button onClick={() => setPhase('running')} size="lg">
                            <Play size={16} fill="currentColor" /> Resume
                          </Button>
                          <Button variant="ghost" onClick={handleReset} size="lg">
                            <RotateCcw size={16} /> Reset
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ── Right column ── */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 20 }} className="md:col-span-2">
                {/* Task selector */}
                {phase === 'setup' && (
                  <div style={panel}>
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Working on</span>
                    </div>
                    <div style={{ padding: '14px 16px 16px' }}>
                      {dataLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Spinner /></div>
                      ) : tasks.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.7)', textAlign: 'center', padding: '16px 0' }}>
                          No active tasks. You can still run a free focus session.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: 9, cursor: 'pointer', transition: 'background 0.15s',
                            border: '1px solid rgba(0,160,255,0.1)',
                            background: !selectedTask ? 'rgba(0,100,200,0.08)' : 'transparent',
                          }}>
                            <input type="radio" name="task" value="" checked={!selectedTask}
                              onChange={() => setSelectedTask(undefined)}
                              style={{ accentColor: '#0092f0', width: 14, height: 14 }} />
                            <span style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)', fontStyle: 'italic' }}>
                              Free focus (no task)
                            </span>
                          </label>
                          {tasks.map(task => (
                            <label key={task.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                              borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                              border: `1px solid ${selectedTask === task.id ? 'rgba(0,160,255,0.3)' : 'rgba(0,160,255,0.08)'}`,
                              background: selectedTask === task.id ? 'rgba(0,100,200,0.1)' : 'transparent',
                            }}>
                              <input type="radio" name="task" value={task.id}
                                checked={selectedTask === task.id}
                                onChange={e => setSelectedTask(e.target.value)}
                                style={{ accentColor: '#0092f0', width: 14, height: 14, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 12, color: 'rgba(180,210,240,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.title}
                              </span>
                              <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session history */}
                {sessions.length > 0 && (
                  <div style={panel}>
                    <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(0,160,255,0.07)' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Recent Sessions</span>
                    </div>
                    <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sessions.slice(0, 5).map(session => (
                        <div key={session.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 9,
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.08)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: session.completed ? '#22c55e' : 'rgba(90,120,160,0.4)',
                              boxShadow: session.completed ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
                            }} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.85)' }}>
                                {session.duration} min
                              </p>
                              <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.7)' }}>
                                {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={session.completed ? 'success' : 'default'}>
                            {session.completed ? 'Done' : 'Incomplete'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
