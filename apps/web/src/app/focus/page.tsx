'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { FocusSession, Task } from '@/types/index';

export default function FocusPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | undefined>();
  const [duration, setDuration] = useState(25);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      const [tasksData, sessionsData] = await Promise.all([
        ApiClient.getTasks(),
        ApiClient.getFocusSessions(),
      ]);
      setTasks(tasksData.filter((t) => !t.completed));
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession() {
    setStarting(true);
    try {
      await ApiClient.createFocusSession({
        taskId: selectedTask,
        duration,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setStarting(false);
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

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Focus Session</h1>
        <p className="text-slate-600 mb-8">
          Choose a task and start a focused work block.
        </p>

        {/* Focus Timer Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-12 border border-blue-200/50 shadow-lg mb-12">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700 mb-4">
              FOCUS TIME REMAINING
            </p>
            <div className="text-6xl font-bold text-blue-900 mb-8 font-mono">
              {duration}
              <span className="text-3xl ml-2">min</span>
            </div>

            <div className="mb-8 flex justify-center gap-4">
              <button
                onClick={() => setDuration(25)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  duration === 25
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/60 text-blue-900 hover:bg-white/80'
                }`}
              >
                25 min
              </button>
              <button
                onClick={() => setDuration(50)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  duration === 50
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/60 text-blue-900 hover:bg-white/80'
                }`}
              >
                50 min
              </button>
              <button
                onClick={() => setDuration(90)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  duration === 90
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/60 text-blue-900 hover:bg-white/80'
                }`}
              >
                90 min
              </button>
            </div>

            <button
              onClick={handleStartSession}
              disabled={starting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 font-semibold text-lg"
            >
              {starting ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </div>

        {/* Task Selection */}
        <div className="mb-12 bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Select Task to Focus On
          </h2>

          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="task"
                    value={task.id}
                    checked={selectedTask === task.id}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-slate-600">{task.description}</p>
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
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No tasks available</p>
              <Link
                href="/brain-dump"
                className="text-blue-600 hover:underline font-medium"
              >
                Create a task via brain dump
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-slate-50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.duration} minute session
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      session.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
