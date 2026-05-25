'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Brain, Sparkles, Save, Trash2, CheckCircle2, AlertCircle, Target, Zap, Clock, Tag, Bot, BookMarked } from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { OrganizeResult, BrainDump } from '@/types/index';
import { useBilling } from '@/hooks/useBilling';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import NeuralBackground from '@/components/ui/NeuralBackground';

const priorityVariant = { High: 'danger', Medium: 'warning', Low: 'success' } as const;

/* Shared panel style */
const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0, 160, 255, 0.12)',
  borderRadius: '1rem',
};

export default function BrainDumpPage() {
  const { checking } = useSessionRestore();
  const [content, setContent]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [dumpsLoading, setDumpsLoading] = useState(true);
  const [error, setError]           = useState('');
  const [result, setResult]         = useState<OrganizeResult | null>(null);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [saving, setSaving]         = useState(false);
  const [acceptedTasks, setAcceptedTasks] = useState<Set<number>>(new Set());
  const [addingTasks, setAddingTasks] = useState(false);
  const [addedMsg, setAddedMsg]     = useState('');
  const [aiMode, setAiMode]         = useState<'ai' | 'offline' | null>(null);
  const [savingAsPlan, setSavingAsPlan] = useState(false);
  const [savedAsPlanMsg, setSavedAsPlanMsg] = useState('');
  const { plan, entitlements, usage, invalidate: invalidateBilling } = useBilling();
  const atExtractionLimit = !!(entitlements && usage && usage.dailyExtractionsUsed >= entitlements.dailyBrainDumpExtractions);
  const canSavePlans = entitlements?.canSaveExecutionPlans ?? false;

  useEffect(() => {
    if (checking) return;
    loadBrainDumps();
    ApiClient.getAIStatus().then(s => setAiMode(s.mode)).catch(() => setAiMode('offline'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

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
    setError(''); setLoading(true); setResult(null);
    setAcceptedTasks(new Set()); setAddedMsg('');
    try {
      const organized = await ApiClient.organizeBrainDump(content);
      setResult(organized);
      setAiMode(organized.mode); // sync header badge to actual result mode
      setAcceptedTasks(new Set(organized.tasks.map((_: string, i: number) => i)));
      setContent('');
      invalidateBilling(); // refresh extraction count
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
      const taskPayloads = selectedIndices.map(index => ({
        title: result.tasks[index],
        priority: (result.priorities[index] || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
      }));
      await ApiClient.createTasksBulk(taskPayloads);
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
      setBrainDumps(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleSaveAsExecutionPlan() {
    if (!result || !canSavePlans) return;
    setSavingAsPlan(true);
    setSavedAsPlanMsg('');
    try {
      await ApiClient.saveExecutionPlan({
        title: result.summary.slice(0, 80) || 'Brain Dump Plan',
        summary: result.summary,
        steps: result.tasks,
        source: 'brain-dump',
      });
      setSavedAsPlanMsg('Saved as execution plan. Find it in Focus.');
    } catch (err) {
      setSavedAsPlanMsg(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSavingAsPlan(false);
    }
  }

  function toggleTask(idx: number) {
    setAcceptedTasks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,120,255,0.15)',
                }}>
                  <Brain size={22} style={{ color: '#40b8ff' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 3,
                  }}>Brain Dump</h1>
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>
                    Write freely. AI extracts actionable tasks.
                  </p>
                </div>
              </div>
              {aiMode !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                  background: aiMode === 'ai' ? 'rgba(0,130,255,0.08)' : 'rgba(60,70,90,0.15)',
                  border: `1px solid ${aiMode === 'ai' ? 'rgba(0,160,255,0.18)' : 'rgba(80,100,140,0.22)'}`,
                }}>
                  {aiMode === 'ai'
                    ? <Sparkles size={11} style={{ color: '#00c0ff' }} />
                    : <Bot size={11} style={{ color: 'rgba(120,140,180,0.8)' }} />}
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: aiMode === 'ai' ? 'rgba(0,200,255,0.8)' : 'rgba(100,130,180,0.65)',
                  }}>
                    {aiMode === 'ai' ? 'MindPad AI' : 'Execution Assistant'}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12, marginBottom: 20,
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                color: '#fca5a5', fontSize: 13,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ color: '#fc8181', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            )}

            {/* ── Input Panel — AI Thought Console ── */}
            <div style={{ ...panel, marginBottom: 24 }}>
              {/* Console header */}
              <div style={{
                padding: '14px 20px 10px',
                borderBottom: '1px solid rgba(0,160,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 99,
                  background: 'rgba(0,130,255,0.08)', border: '1px solid rgba(0,160,255,0.15)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c0ff', boxShadow: '0 0 6px rgba(0,200,255,0.9)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,200,255,0.85)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Thought Input
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(70,100,140,0.7)' }}>— stream consciousness, AI does the rest</span>
              </div>

              <div style={{ padding: '20px 20px 16px' }}>
                <form onSubmit={handleOrganize}>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Dump everything here — tasks, ideas, worries, goals, random thoughts. Don't worry about structure. MindPad AI will make sense of it..."
                      style={{
                        width: '100%', minHeight: 200,
                        padding: '16px 18px', paddingBottom: 36,
                        borderRadius: 12, border: '1px solid rgba(0,160,255,0.15)',
                        background: 'rgba(0,0,0,0.45)', color: 'rgba(200,220,245,0.9)',
                        fontSize: 14, lineHeight: 1.7, resize: 'vertical',
                        outline: 'none', transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,160,255,0.45)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.08), 0 0 30px rgba(0,160,255,0.06)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,160,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 12, right: 14,
                      fontSize: 11, color: 'rgba(60,90,130,0.7)',
                    }}>
                      {content.length} chars
                    </span>
                  </div>

                  {/* Extraction usage */}
                  {entitlements && usage && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: atExtractionLimit ? 'rgba(252,165,165,0.8)' : 'rgba(70,100,140,0.65)' }}>
                        Daily extractions: {usage.dailyExtractionsUsed} / {entitlements.dailyBrainDumpExtractions}
                        {atExtractionLimit && ' — limit reached'}
                      </span>
                      {atExtractionLimit && (
                        <Link href="/pricing" style={{ fontSize: 11, fontWeight: 700, color: '#ffb700', textDecoration: 'none' }}>
                          <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />Upgrade
                        </Link>
                      )}
                    </div>
                  )}

                  {/* CTA row */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                    {/* Primary AI extract button */}
                    <button
                      type="submit"
                      disabled={loading || !content.trim() || atExtractionLimit}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '0 22px', height: 44, borderRadius: 12,
                        border: '1px solid rgba(0,180,255,0.35)',
                        background: loading
                          ? 'rgba(0,80,180,0.3)'
                          : 'linear-gradient(135deg, #0092f0 0%, #0056b8 100%)',
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
                        opacity: !content.trim() ? 0.5 : 1,
                        transition: 'all 0.2s',
                        boxShadow: content.trim() ? '0 4px 20px rgba(0,120,240,0.3)' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (content.trim() && !loading) {
                          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,160,255,0.45)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = content.trim() ? '0 4px 20px rgba(0,120,240,0.3)' : 'none';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {loading ? (
                        <>
                          <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                          Extracting...
                        </>
                      ) : (
                        <><Sparkles size={15} /> Extract Tasks with AI</>
                      )}
                    </button>

                    <Button type="button" variant="ghost" onClick={handleSave} loading={saving} disabled={!content.trim()}>
                      <Save size={14} /> Save as Note
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* ── AI Result Panel ── */}
            {result && (
              <div style={{
                ...panel,
                borderColor: 'rgba(0,160,255,0.25)',
                borderLeft: '3px solid rgba(0,160,255,0.6)',
                marginBottom: 24,
                boxShadow: '0 0 40px rgba(0,80,200,0.1)',
              }}>
                <div style={{
                  padding: '14px 20px 10px',
                  borderBottom: '1px solid rgba(0,160,255,0.1)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Sparkles size={15} style={{ color: '#40b8ff' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Extracted Tasks</span>
                  <span style={{ fontSize: 12, color: 'rgba(70,100,140,0.7)' }}>— review and accept</span>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* AI mode badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 99,
                      background: result.mode === 'ai' ? 'rgba(0,130,255,0.08)' : 'rgba(60,70,90,0.15)',
                      border: `1px solid ${result.mode === 'ai' ? 'rgba(0,160,255,0.2)' : 'rgba(80,100,140,0.22)'}`,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: result.mode === 'ai' ? '#00c0ff' : 'rgba(120,140,180,0.5)',
                        boxShadow: result.mode === 'ai' ? '0 0 6px rgba(0,200,255,0.8)' : 'none',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: result.mode === 'ai' ? 'rgba(0,200,255,0.8)' : 'rgba(100,130,180,0.65)',
                      }}>
                        {result.mode === 'ai' ? 'MindPad AI' : 'Execution Assistant'}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{
                    padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(0,160,255,0.1)',
                  }}>
                    <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)', lineHeight: 1.65 }}>{result.summary}</p>
                  </div>

                  {/* Focus recommendation */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(255,150,0,0.06)', border: '1px solid rgba(255,150,0,0.2)',
                  }}>
                    <Target size={14} style={{ marginTop: 2, flexShrink: 0, color: '#ffb700' }} />
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffb700', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Focus First
                      </span>
                      <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.85)' }}>{result.focusRecommendation}</p>
                    </div>
                  </div>

                  {/* Reasoning — only show when AI is active and reasoning has meaningful content */}
                  {result.mode === 'ai' && result.reasoning && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 9, marginBottom: 12,
                      background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,160,255,0.08)',
                      fontSize: 12, color: 'rgba(100,140,190,0.8)', lineHeight: 1.6, fontStyle: 'italic',
                    }}>
                      {result.reasoning}
                    </div>
                  )}

                  {/* Task checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {result.tasks.map((task, idx) => (
                      <label key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: acceptedTasks.has(idx) ? 'rgba(0,130,255,0.08)' : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${acceptedTasks.has(idx) ? 'rgba(0,160,255,0.3)' : 'rgba(0,160,255,0.1)'}`,
                      }}>
                        <input
                          type="checkbox"
                          checked={acceptedTasks.has(idx)}
                          onChange={() => toggleTask(idx)}
                          style={{ width: 16, height: 16, accentColor: '#0092f0', cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, color: 'rgba(200,220,240,0.9)', fontWeight: 500, marginBottom: 5 }}>
                            {task}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <Badge variant={priorityVariant[result.priorities[idx] as keyof typeof priorityVariant] ?? 'default'}>
                              {result.priorities[idx] || 'Medium'}
                            </Badge>
                            {result.categories?.[idx] && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                                background: 'rgba(80,140,200,0.1)', border: '1px solid rgba(80,140,200,0.2)',
                                color: 'rgba(120,180,240,0.8)',
                              }}>
                                <Tag size={9} />{result.categories[idx]}
                              </span>
                            )}
                            {result.estimatedMinutes?.[idx] && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                                background: 'rgba(80,100,160,0.1)', border: '1px solid rgba(80,100,160,0.2)',
                                color: 'rgba(120,150,220,0.8)',
                              }}>
                                <Clock size={9} />{result.estimatedMinutes[idx]}m
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Daily plan suggestion */}
                  {result.dailyPlanSuggestion && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 10, marginBottom: 14,
                      background: 'rgba(0,80,200,0.07)', border: '1px solid rgba(0,160,255,0.15)',
                      fontSize: 13, color: 'rgba(150,200,255,0.85)', lineHeight: 1.6,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#40b8ff', marginBottom: 6 }}>Daily Plan</p>
                      {result.dailyPlanSuggestion}
                    </div>
                  )}

                  {addedMsg ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 10, marginBottom: 10,
                      background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
                      color: '#6ee7b7', fontSize: 13, fontWeight: 500,
                    }}>
                      <CheckCircle2 size={15} />
                      {addedMsg}
                    </div>
                  ) : (
                    <button
                      onClick={handleAcceptTasks}
                      disabled={addingTasks || acceptedTasks.size === 0}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', height: 44, borderRadius: 10, marginBottom: 10,
                        border: '1px solid rgba(0,160,255,0.25)',
                        background: acceptedTasks.size === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,100,200,0.12)',
                        color: acceptedTasks.size === 0 ? 'rgba(90,120,160,0.5)' : 'rgba(100,180,255,0.9)',
                        fontSize: 13, fontWeight: 600, cursor: acceptedTasks.size === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Zap size={13} />
                      {addingTasks ? 'Adding...' : `Add ${acceptedTasks.size} selected task${acceptedTasks.size !== 1 ? 's' : ''} to Tasks`}
                    </button>
                  )}

                  {/* Save as Execution Plan */}
                  {savedAsPlanMsg ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                      color: '#a78bfa', fontSize: 12, fontWeight: 500,
                    }}>
                      <BookMarked size={13} />{savedAsPlanMsg}
                    </div>
                  ) : canSavePlans ? (
                    <button
                      onClick={handleSaveAsExecutionPlan}
                      disabled={savingAsPlan}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        width: '100%', height: 38, borderRadius: 10,
                        border: '1px solid rgba(124,58,237,0.25)',
                        background: 'rgba(124,58,237,0.07)',
                        color: '#a78bfa', fontSize: 12, fontWeight: 600,
                        cursor: savingAsPlan ? 'wait' : 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <BookMarked size={12} />
                      {savingAsPlan ? 'Saving...' : 'Save as Execution Plan'}
                    </button>
                  ) : (
                    <Link href="/pricing" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      width: '100%', height: 38, borderRadius: 10,
                      border: '1px solid rgba(80,60,160,0.15)',
                      background: 'rgba(3, 5, 16, 0.5)',
                      color: 'rgba(130,100,220,0.5)', fontSize: 12, fontWeight: 600,
                      textDecoration: 'none',
                    }}>
                      <BookMarked size={12} />
                      Save as Execution Plan <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.15)', marginLeft: 4 }}>PRO</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ── Saved Notes ── */}
            <div style={panel}>
              <div style={{
                padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>
                  Saved Notes
                  {brainDumps.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'rgba(70,100,140,0.7)' }}>
                      ({brainDumps.length})
                    </span>
                  )}
                </span>
              </div>

              <div style={{ padding: '16px 20px 20px' }}>
                {dumpsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                    <Spinner />
                  </div>
                ) : brainDumps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <Brain size={30} style={{ margin: '0 auto 14px', color: 'rgba(0,160,255,0.22)' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(140,180,230,0.75)', marginBottom: 6 }}>No saved notes yet</p>
                    <p style={{ fontSize: 12, color: 'rgba(60,90,130,0.75)', lineHeight: 1.6 }}>
                      Write what's on your mind above — messy is fine.<br />
                      Extract tasks to turn it into a clear action list.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {brainDumps.map(dump => (
                      <div key={dump.id} className="group" style={{
                        padding: '14px 16px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.09)',
                        transition: 'border-color 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.22)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,160,255,0.09)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.7)', marginBottom: 6 }}>
                              {new Date(dump.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p style={{ fontSize: 13, color: 'rgba(180,210,240,0.8)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dump.content}
                            </p>
                            {dump.summary && (
                              <div style={{ marginTop: 8 }}>
                                <Badge variant="info">Tasks extracted</Badge>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDump(dump.id)}
                            style={{
                              padding: '6px', borderRadius: 7, background: 'none', border: 'none',
                              color: 'rgba(90,120,160,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                              flexShrink: 0,
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.color = '#ff8080';
                              (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.color = 'rgba(90,120,160,0.5)';
                              (e.currentTarget as HTMLElement).style.background = 'none';
                            }}
                          >
                            <Trash2 size={13} />
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
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
