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
import Spinner from '@/components/ui/Spinner';
import NeuralBackground from '@/components/ui/NeuralBackground';

type Filter = 'all' | 'active' | 'completed' | 'high' | 'medium' | 'low';

const priorityVariant = { high: 'danger', medium: 'warning', low: 'success' } as const;
const priorityBorder  = { high: 'rgba(220,38,38,0.55)', medium: 'rgba(217,119,6,0.55)', low: 'rgba(22,163,74,0.55)' };

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1rem',
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<Filter>('all');
  const [search, setSearch]         = useState('');
  const [creating, setCreating]     = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editTitle, setEditTitle]   = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

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
      setTasks(prev => [task as Task, ...prev]);
      setNewTitle(''); setNewPriority('medium'); setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally { setSaving(false); }
  }

  async function handleToggle(task: Task) {
    try {
      const updated = await ApiClient.updateTask(task.id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === task.id ? (updated as Task) : t));
    } catch { setError('Failed to update task'); }
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const updated = await ApiClient.updateTask(id, { title: editTitle.trim(), priority: editPriority });
      setTasks(prev => prev.map(t => t.id === id ? (updated as Task) : t));
      setEditingId(null);
    } catch { setError('Failed to save task'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await ApiClient.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { setError('Failed to delete task'); }
  }

  function startEdit(task: Task) {
    setEditingId(task.id); setEditTitle(task.title); setEditPriority(task.priority);
  }

  const filtered = tasks.filter(t => {
    if (!t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active')    return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'high' || filter === 'medium' || filter === 'low') return t.priority === filter;
    return true;
  });

  const counts = { active: tasks.filter(t => !t.completed).length, completed: tasks.filter(t => t.completed).length };

  const inputStyle: React.CSSProperties = {
    height: 42, padding: '0 14px', borderRadius: 10,
    border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(200,220,245,0.9)', fontSize: 14, outline: 'none', transition: 'all 0.2s',
  };

  const selectStyle: React.CSSProperties = {
    height: 42, padding: '0 12px', borderRadius: 10,
    border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(180,210,240,0.9)', fontSize: 13, outline: 'none', cursor: 'pointer',
  };

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,120,255,0.15)',
                }}>
                  <CheckSquare size={21} style={{ color: '#40b8ff' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3,
                  }}>Tasks</h1>
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>
                    {counts.active} active · {counts.completed} completed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreating(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 18px', height: 40, borderRadius: 11,
                  border: '1px solid rgba(0,180,255,0.35)',
                  background: 'linear-gradient(135deg, #0080d8 0%, #0055a8 100%)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,100,220,0.25)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,160,255,0.4)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,100,220,0.25)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <Plus size={15} /> New Task
              </button>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 12, marginBottom: 20, background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', fontSize: 13,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            )}

            {/* ── Create Form ── */}
            {creating && (
              <div style={{ ...panel, marginBottom: 20, padding: '20px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)', marginBottom: 14 }}>New Task</p>
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    autoFocus placeholder="Task title" value={newTitle}
                    onChange={e => setNewTitle(e.target.value)} required
                    style={{ ...inputStyle, width: '100%' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value as 'low'|'medium'|'high')} style={selectStyle}>
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                      <Button type="submit" size="sm" loading={saving} disabled={!newTitle.trim()}>Add Task</Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ── Filters + Search ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {/* Status filters */}
              <div style={{
                display: 'flex', background: 'rgba(5,10,22,0.8)',
                border: '1px solid rgba(0,160,255,0.12)', borderRadius: 10, padding: 4, gap: 2,
              }}>
                {(['all', 'active', 'completed'] as const).map(key => {
                  const label = key === 'all' ? `All (${tasks.length})` : key === 'active' ? `Active (${counts.active})` : `Done (${counts.completed})`;
                  return (
                    <button key={key} onClick={() => setFilter(key)} style={{
                      padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                      background: filter === key ? 'rgba(0,130,255,0.2)' : 'transparent',
                      color: filter === key ? '#60c8ff' : 'rgba(90,120,160,0.8)',
                      boxShadow: filter === key ? '0 0 12px rgba(0,160,255,0.15)' : 'none',
                    }}>{label}</button>
                  );
                })}
              </div>
              {/* Priority filters */}
              <div style={{
                display: 'flex', background: 'rgba(5,10,22,0.8)',
                border: '1px solid rgba(0,160,255,0.12)', borderRadius: 10, padding: 4, gap: 2,
              }}>
                {(['high', 'medium', 'low'] as const).map(key => {
                  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
                  return (
                    <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)} style={{
                      padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: 'none', textTransform: 'capitalize',
                      background: filter === key ? `${colors[key]}22` : 'transparent',
                      color: filter === key ? colors[key] : 'rgba(90,120,160,0.8)',
                    }}>{key}</button>
                  );
                })}
              </div>
              {/* Search */}
              <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(90,120,160,0.6)' }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  style={{ ...inputStyle, width: '100%', paddingLeft: 32, height: 38, fontSize: 13 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.15)'; }}
                />
              </div>
            </div>

            {/* ── Task List ── */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div style={{ ...panel, padding: '40px', textAlign: 'center' }}>
                <CheckSquare size={28} style={{ margin: '0 auto 10px', color: 'rgba(0,160,255,0.25)' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(180,210,240,0.7)', marginBottom: 6 }}>
                  {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(70,100,140,0.7)' }}>
                  {tasks.length === 0
                    ? 'Start by adding a task or extracting them from a brain dump.'
                    : 'Try a different filter or search term.'}
                </p>
                {tasks.length === 0 && (
                  <button onClick={() => setCreating(true)} style={{
                    marginTop: 14, padding: '8px 18px', borderRadius: 9,
                    background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.2)',
                    color: '#40b8ff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>Add your first task</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(task => (
                  <div key={task.id} style={{
                    ...panel,
                    borderLeft: `3px solid ${priorityBorder[task.priority]}`,
                    opacity: task.completed ? 0.55 : 1,
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => {
                      if (!task.completed) (e.currentTarget as HTMLElement).style.borderColor = `rgba(0,160,255,0.25)`;
                    }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.12)'}
                  >
                    {editingId === task.id ? (
                      <div style={{ padding: '16px' }}>
                        <input
                          autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.5)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,160,255,0.15)'; }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <select value={editPriority} onChange={e => setEditPriority(e.target.value as 'low'|'medium'|'high')} style={selectStyle}>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="sm" loading={saving} onClick={() => handleSaveEdit(task.id)}>Save</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggle(task)}
                          style={{
                            marginTop: 1, flexShrink: 0, width: 20, height: 20, borderRadius: 6,
                            border: task.completed ? 'none' : '1.5px solid rgba(0,160,255,0.35)',
                            background: task.completed ? '#0092f0' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: task.completed ? '0 0 10px rgba(0,160,255,0.4)' : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!task.completed) {
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.7)';
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px rgba(0,160,255,0.25)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!task.completed) {
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.35)';
                              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }
                          }}
                        >
                          {task.completed && <Check size={11} color="white" strokeWidth={3} />}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 14, fontWeight: 500, lineHeight: 1.4,
                            color: task.completed ? 'rgba(90,120,160,0.6)' : 'rgba(200,220,245,0.9)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                            <span style={{ fontSize: 11, color: 'rgba(70,100,140,0.65)' }}>
                              {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => startEdit(task)} style={{
                            padding: 7, borderRadius: 7, background: 'none', border: 'none',
                            color: 'rgba(90,120,160,0.6)', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#60c8ff'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,160,255,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(90,120,160,0.6)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(task.id)} style={{
                            padding: 7, borderRadius: 7, background: 'none', border: 'none',
                            color: 'rgba(90,120,160,0.6)', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff8080'; (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(90,120,160,0.6)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          >
                            <Trash2 size={13} />
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
