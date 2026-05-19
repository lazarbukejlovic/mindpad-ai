'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Plus, Pencil, Trash2, Search, AlertCircle, Check } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { Task } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';

type Filter = 'all' | 'active' | 'completed' | 'high' | 'medium' | 'low';

const priorityVariant = {
  high:   'danger',
  medium: 'warning',
  low:    'success',
} as const;

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { setLoading(false); router.push('/login'); return; }
    loadTasks();
  }, [router]);

  async function loadTasks() {
    try {
      const data = await ApiClient.getTasks();
      setTasks(data as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const task = await ApiClient.createTask({ title: newTitle.trim(), priority: newPriority });
      setTasks((prev) => [task as Task, ...prev]);
      setNewTitle('');
      setNewPriority('medium');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task: Task) {
    try {
      const updated = await ApiClient.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (updated as Task) : t)));
    } catch { setError('Failed to update task'); }
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const updated = await ApiClient.updateTask(id, { title: editTitle.trim(), priority: editPriority });
      setTasks((prev) => prev.map((t) => (t.id === id ? (updated as Task) : t)));
      setEditingId(null);
    } catch { setError('Failed to save task'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await ApiClient.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch { setError('Failed to delete task'); }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
  }

  const filtered = tasks.filter((t) => {
    if (!t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'high' || filter === 'medium' || filter === 'low') return t.priority === filter;
    return true;
  });

  const counts = {
    active:    tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  };

  const statusFilters = [
    { key: 'all',       label: `All (${tasks.length})` },
    { key: 'active',    label: `Active (${counts.active})` },
    { key: 'completed', label: `Done (${counts.completed})` },
  ] as const;

  const priorityFilters = [
    { key: 'high',   label: 'High',   variant: 'danger'  as const },
    { key: 'medium', label: 'Medium', variant: 'warning' as const },
    { key: 'low',    label: 'Low',    variant: 'success' as const },
  ] as const;

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <CheckSquare size={20} className="text-brand-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[rgb(var(--text))]">Tasks</h1>
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    {counts.active} active · {counts.completed} completed
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus size={14} />
                New Task
              </Button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError('')}>×</button>
              </div>
            )}

            {/* Create form */}
            {creating && (
              <div className="card p-5 mb-6">
                <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-4">New Task</h2>
                <form onSubmit={handleCreate} className="space-y-3">
                  <Input
                    autoFocus
                    placeholder="Task title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm text-[rgb(var(--text))] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreating(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        loading={saving}
                        disabled={!newTitle.trim()}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Filters + search */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-1 gap-0.5">
                {statusFilters.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filter === key
                        ? 'bg-[rgb(var(--text))] text-[rgb(var(--bg))]'
                        : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-1 gap-0.5">
                {priorityFilters.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(filter === key ? 'all' : key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filter === key
                        ? key === 'high'
                          ? 'bg-red-600 text-white'
                          : key === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                        : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-w-40 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="h-9 w-full pl-8 pr-3 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg text-xs text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Task list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="card">
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    heading="No tasks yet"
                    description="Start by adding a task or extracting them from a brain dump."
                    action={{ label: 'Add your first task', onClick: () => setCreating(true) }}
                  />
                ) : (
                  <EmptyState
                    icon={Search}
                    heading="No matching tasks"
                    description="Try a different filter or search term."
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((task) => (
                  <div
                    key={task.id}
                    className={`card transition-all duration-150 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    {editingId === task.id ? (
                      <div className="p-4 space-y-3">
                        <Input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <div className="flex items-center gap-3">
                          <select
                            value={editPriority}
                            onChange={(e) =>
                              setEditPriority(e.target.value as 'low' | 'medium' | 'high')
                            }
                            className="h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm text-[rgb(var(--text))] outline-none focus:border-brand-500"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <div className="flex gap-2 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              loading={saving}
                              onClick={() => handleSaveEdit(task.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4">
                        <button
                          onClick={() => handleToggle(task)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-brand-500 border-brand-500'
                              : 'border-[rgb(var(--border))] hover:border-brand-500'
                          }`}
                        >
                          {task.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              task.completed
                                ? 'line-through text-[rgb(var(--text-muted))]'
                                : 'text-[rgb(var(--text))]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant={priorityVariant[task.priority]}>
                              {task.priority}
                            </Badge>
                            <span className="text-[10px] text-[rgb(var(--text-muted))]">
                              {new Date(task.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(task)}
                            className="p-1.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] rounded-md transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
