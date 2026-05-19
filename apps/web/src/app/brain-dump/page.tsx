'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Save, Trash2, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { OrganizeResult, BrainDump } from '@/types/index';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';

const priorityVariant = {
  High:   'danger',
  Medium: 'warning',
  Low:    'success',
} as const;

export default function BrainDumpPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [dumpsLoading, setDumpsLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [saving, setSaving] = useState(false);
  const [acceptedTasks, setAcceptedTasks] = useState<Set<number>>(new Set());
  const [addingTasks, setAddingTasks] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    if (!getToken()) { setDumpsLoading(false); router.push('/login'); return; }
    loadBrainDumps();
  }, [router]);

  async function loadBrainDumps() {
    try {
      const data = await ApiClient.getBrainDumps();
      setBrainDumps(data as BrainDump[]);
    } catch { /* silent */ }
    finally { setDumpsLoading(false); }
  }

  async function handleOrganize(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) { setError('Please write something first'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setAcceptedTasks(new Set());
    setAddedMsg('');
    try {
      const organized = await ApiClient.organizeBrainDump(content);
      setResult(organized);
      setAcceptedTasks(new Set(organized.tasks.map((_: string, i: number) => i)));
      setContent('');
      await loadBrainDumps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to organize');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) { setError('Please write something first'); return; }
    setSaving(true);
    try {
      await ApiClient.createBrainDump(content);
      setContent('');
      await loadBrainDumps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleAcceptTasks() {
    if (!result) return;
    setAddingTasks(true);
    const selectedIndices = Array.from(acceptedTasks).sort((a, b) => a - b);
    try {
      await Promise.all(
        selectedIndices.map((index) =>
          ApiClient.createTask({
            title: result.tasks[index],
            priority: (result.priorities[index] || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
          })
        )
      );
      setAddedMsg(`${selectedIndices.length} task${selectedIndices.length !== 1 ? 's' : ''} added to your task list.`);
      setAcceptedTasks(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks');
    } finally {
      setAddingTasks(false);
    }
  }

  async function handleDeleteDump(id: string) {
    try {
      await ApiClient.deleteBrainDump(id);
      setBrainDumps((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  function toggleTask(idx: number) {
    setAcceptedTasks((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-page">
      <AppNav />
      <div className="md:pl-60">
        <div className="pt-14 md:pt-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <Brain size={20} className="text-brand-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--text))]">Brain Dump</h1>
                <p className="text-sm text-[rgb(var(--text-muted))]">
                  Write freely. AI extracts actionable tasks.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
              </div>
            )}

            {/* Input card */}
            <div className="card p-5 mb-6">
              <form onSubmit={handleOrganize}>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Dump everything here — tasks, ideas, worries, goals. Don't worry about structure. AI will make sense of it."
                    className="w-full min-h-48 p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))] leading-relaxed resize-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-[rgb(var(--text-muted))]">
                    {content.length} chars
                  </span>
                </div>
                <div className="flex gap-3 mt-3">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!content.trim()}
                  >
                    <Sparkles size={14} />
                    {loading ? 'Extracting...' : 'Extract Tasks with AI'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!content.trim()}
                  >
                    <Save size={14} />
                    Save as Note
                  </Button>
                </div>
              </form>
            </div>

            {/* AI Result */}
            {result && (
              <div
                className="card p-5 mb-6"
                style={{ borderColor: 'rgb(var(--brand) / 0.3)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-brand-500" />
                  <h2 className="text-sm font-semibold text-[rgb(var(--text))]">
                    Extracted Tasks
                  </h2>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    — review and accept
                  </span>
                </div>

                {/* Summary */}
                <div className="p-4 bg-[rgb(var(--surface-2))] rounded-lg mb-4">
                  <p className="text-sm text-[rgb(var(--text))] leading-relaxed">{result.summary}</p>
                </div>

                {/* Focus recommendation */}
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border mb-4"
                  style={{
                    backgroundColor: 'rgb(var(--warning) / 0.05)',
                    borderColor: 'rgb(var(--warning) / 0.3)',
                  }}
                >
                  <Target size={15} className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      Focus First
                    </span>
                    <p className="text-sm text-[rgb(var(--text))] mt-0.5">{result.focusRecommendation}</p>
                  </div>
                </div>

                {/* Task checkboxes */}
                <div className="space-y-2 mb-4">
                  {result.tasks.map((task, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        acceptedTasks.has(idx)
                          ? 'border-brand-500/30 bg-brand-500/5'
                          : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedTasks.has(idx)}
                        onChange={() => toggleTask(idx)}
                        className="w-4 h-4 rounded accent-brand-500"
                      />
                      <span className="flex-1 text-sm text-[rgb(var(--text))] font-medium">
                        {task}
                      </span>
                      <Badge
                        variant={
                          priorityVariant[result.priorities[idx] as keyof typeof priorityVariant] ??
                          'default'
                        }
                      >
                        {result.priorities[idx] || 'Medium'}
                      </Badge>
                    </label>
                  ))}
                </div>

                {addedMsg ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 size={16} />
                    {addedMsg}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleAcceptTasks}
                    loading={addingTasks}
                    disabled={acceptedTasks.size === 0}
                    className="w-full"
                  >
                    {addingTasks
                      ? 'Adding...'
                      : `Add ${acceptedTasks.size} selected task${acceptedTasks.size !== 1 ? 's' : ''} to Tasks`}
                  </Button>
                )}
              </div>
            )}

            {/* Saved notes */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--text))]">
                  Saved Notes
                  {brainDumps.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-[rgb(var(--text-muted))]">
                      ({brainDumps.length})
                    </span>
                  )}
                </h2>
              </div>

              {dumpsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : brainDumps.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  heading="No saved notes"
                  description="Write your first brain dump above to get started."
                />
              ) : (
                <div className="space-y-3">
                  {brainDumps.map((dump) => (
                    <div
                      key={dump.id}
                      className="group p-4 border border-[rgb(var(--border))] rounded-lg hover:border-brand-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[rgb(var(--text-muted))] mb-1.5">
                            {new Date(dump.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-sm text-[rgb(var(--text))] leading-relaxed line-clamp-3">
                            {dump.content}
                          </p>
                          {dump.summary && (
                            <div className="flex items-center gap-1 mt-2">
                              <Badge variant="info">Tasks extracted</Badge>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDump(dump.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
