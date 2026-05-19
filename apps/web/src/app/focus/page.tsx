'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Play, Pause, RotateCcw, CheckCircle2, Flame } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { FocusSession, Task } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type Phase = 'setup' | 'running' | 'paused' | 'completed';

const DURATIONS = [
  { label: '25 min', value: 25 },
  { label: '50 min', value: 50 },
  { label: '90 min', value: 90 },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function TimerRing({ progress }: { progress: number }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={r} stroke="rgb(var(--border))" strokeWidth="8" fill="none" />
      <circle
        cx="100"
        cy="100"
        r={r}
        stroke="url(#timerGrad)"
        strokeWidth="8"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
      <defs>
        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(var(--brand))" />
          <stop offset="100%" stopColor="#38a9ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const priorityVariant = {
  high:   'danger',
  medium: 'warning',
  low:    'success',
} as const;

export default function FocusPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | undefined>();
  const [duration, setDuration] = useState(25);
  const [phase, setPhase] = useState<Phase>('setup');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [dataLoading, setDataLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!getToken()) { setDataLoading(false); router.push('/login'); return; }
    loadData();
  }, [router]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setPhase('completed');
            if (sessionIdRef.current) {
              ApiClient.completeFocusSession(sessionIdRef.current)
                .then(() => loadData())
                .catch(console.error);
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
      const [tasksData, sessionsData] = await Promise.all([
        ApiClient.getTasks(),
        ApiClient.getFocusSessions(),
      ]);
      setTasks((tasksData as Task[]).filter((t) => !t.completed));
      setSessions(sessionsData as FocusSession[]);
    } catch { /* silent */ }
    finally { setDataLoading(false); }
  }

  async function handleStart() {
    setStarting(true);
    try {
      const session = await ApiClient.createFocusSession({ taskId: selectedTask, duration });
      sessionIdRef.current = session.id;
      setSecondsLeft(duration * 60);
      setTotalSeconds(duration * 60);
      setPhase('running');
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
    setSecondsLeft(duration * 60);
    setTotalSeconds(duration * 60);
    setPhase('setup');
  }

  function handleDurationChange(val: number) {
    if (phase === 'setup') {
      setDuration(val);
      setSecondsLeft(val * 60);
      setTotalSeconds(val * 60);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const selectedTaskObj = tasks.find((t) => t.id === selectedTask);
  const completedSessions = sessions.filter((s) => s.completed);
  const totalFocusMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Timer size={20} className="text-brand-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[rgb(var(--text))]">Focus</h1>
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    {completedSessions.length} sessions · {totalFocusMinutes} min total
                  </p>
                </div>
              </div>
              {completedSessions.length >= 3 && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <Flame size={16} />
                  {completedSessions.length} sessions done
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Timer column */}
              <div className="md:col-span-3 card p-8">
                {phase === 'completed' ? (
                  <div className="text-center py-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">
                      Session Complete!
                    </h2>
                    <p className="text-sm text-[rgb(var(--text-muted))] mb-1">
                      You focused for <span className="font-semibold text-[rgb(var(--text))]">{duration} minutes</span>.
                    </p>
                    {selectedTaskObj && (
                      <p className="text-sm text-[rgb(var(--text-muted))] mb-6">
                        Working on:{' '}
                        <span className="font-semibold text-[rgb(var(--text))]">
                          {selectedTaskObj.title}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-[rgb(var(--text-muted))] mb-6">
                      Take a short break before your next session.
                    </p>
                    <Button onClick={handleReset}>Start New Session</Button>
                  </div>
                ) : (
                  <>
                    {/* Duration selector */}
                    {phase === 'setup' && (
                      <div className="flex justify-center gap-2 mb-8">
                        {DURATIONS.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => handleDurationChange(d.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              duration === d.value
                                ? 'bg-brand-500 text-white'
                                : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Phase badge */}
                    <div className="flex justify-center mb-3">
                      <Badge
                        variant={
                          phase === 'running' ? 'info' : phase === 'paused' ? 'warning' : 'default'
                        }
                      >
                        {phase === 'setup' ? 'Ready' : phase === 'running' ? 'Focusing' : 'Paused'}
                      </Badge>
                    </div>

                    {/* Timer ring */}
                    <div className="relative w-52 h-52 mx-auto mb-8">
                      <TimerRing progress={progress} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-[rgb(var(--text))] font-mono tabular-nums">
                          {pad(minutes)}:{pad(seconds)}
                        </span>
                        {phase !== 'setup' && selectedTaskObj && (
                          <span className="text-xs text-[rgb(var(--text-muted))] mt-1 max-w-32 truncate text-center">
                            {selectedTaskObj.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-3">
                      {phase === 'setup' && (
                        <Button
                          onClick={handleStart}
                          loading={starting || dataLoading}
                          size="lg"
                        >
                          <Play size={16} fill="currentColor" />
                          Start Session
                        </Button>
                      )}
                      {phase === 'running' && (
                        <>
                          <Button onClick={() => setPhase('paused')} size="lg">
                            <Pause size={16} fill="currentColor" />
                            Pause
                          </Button>
                          <Button variant="ghost" onClick={handleReset} size="lg">
                            <RotateCcw size={16} />
                            Reset
                          </Button>
                        </>
                      )}
                      {phase === 'paused' && (
                        <>
                          <Button onClick={() => setPhase('running')} size="lg">
                            <Play size={16} fill="currentColor" />
                            Resume
                          </Button>
                          <Button variant="ghost" onClick={handleReset} size="lg">
                            <RotateCcw size={16} />
                            Reset
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task selector column */}
              <div className="md:col-span-2 space-y-4">
                {/* Task selector — setup only */}
                {phase === 'setup' && (
                  <div className="card p-5">
                    <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-3">
                      Working on
                    </h2>

                    {dataLoading ? (
                      <div className="flex justify-center py-6"><Spinner /></div>
                    ) : tasks.length === 0 ? (
                      <p className="text-sm text-[rgb(var(--text-muted))] text-center py-4">
                        No active tasks. You can still run a free focus session.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-3 p-3 border border-[rgb(var(--border))] rounded-lg cursor-pointer hover:bg-[rgb(var(--surface-2))] transition-colors">
                          <input
                            type="radio"
                            name="task"
                            value=""
                            checked={!selectedTask}
                            onChange={() => setSelectedTask(undefined)}
                            className="w-4 h-4"
                            style={{ accentColor: 'rgb(var(--brand))' }}
                          />
                          <span className="text-sm text-[rgb(var(--text-muted))] italic">
                            Free focus (no task)
                          </span>
                        </label>
                        {tasks.map((task) => (
                          <label
                            key={task.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTask === task.id
                                ? 'border-brand-500/40 bg-brand-500/5'
                                : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="task"
                              value={task.id}
                              checked={selectedTask === task.id}
                              onChange={(e) => setSelectedTask(e.target.value)}
                              className="w-4 h-4 flex-shrink-0"
                              style={{ accentColor: 'rgb(var(--brand))' }}
                            />
                            <span className="flex-1 min-w-0 text-sm text-[rgb(var(--text))] truncate">
                              {task.title}
                            </span>
                            <Badge variant={priorityVariant[task.priority]}>
                              {task.priority}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Session history */}
                {sessions.length > 0 && (
                  <div className="card p-5">
                    <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-3">
                      Recent Sessions
                    </h2>
                    <div className="space-y-2">
                      {sessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2.5 bg-[rgb(var(--surface-2))] rounded-lg"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                session.completed ? 'bg-emerald-500' : 'bg-[rgb(var(--border))]'
                              }`}
                            />
                            <div>
                              <p className="text-xs font-medium text-[rgb(var(--text))]">
                                {session.duration} min
                              </p>
                              <p className="text-[10px] text-[rgb(var(--text-muted))]">
                                {new Date(session.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
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
