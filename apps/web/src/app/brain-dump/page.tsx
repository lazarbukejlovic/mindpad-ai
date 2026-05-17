'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken } from '@/lib/auth';
import { OrganizeResult, BrainDump } from '@/types/index';

export default function BrainDumpPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadBrainDumps();
  }, [router]);

  async function loadBrainDumps() {
    try {
      const data = await ApiClient.getBrainDumps();
      setBrainDumps(data);
    } catch (err) {
      console.error('Failed to load brain dumps:', err);
    }
  }

  async function handleOrganize(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write something first');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const organized = await ApiClient.organizeBrainDump(content);
      setResult(organized);
      setContent('');
      await loadBrainDumps();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to organize';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      setError('Please write something first');
      return;
    }

    setSaving(true);
    try {
      await ApiClient.createBrainDump(content);
      setContent('');
      await loadBrainDumps();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Brain Dump</h1>
        <p className="text-slate-600 mb-8">
          Write down everything on your mind. AI will organize it into actionable
          tasks.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Input Section */}
        <form onSubmit={handleOrganize} className="mb-12">
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dump all your thoughts here... tasks, ideas, concerns, everything. Don't worry about structure—AI will organize it."
              className="w-full h-48 p-6 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#4b7cb3] to-[#5a8cc4] text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 font-medium"
            >
              {loading ? 'Organizing...' : 'Organize with AI'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-6 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Only'}
            </button>
          </div>
        </form>

        {/* Result Display */}
        {result && (
          <div className="mb-12 bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              ✨ Your Organized View
            </h2>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                <p className="text-blue-800">{result.summary}</p>
              </div>

              {/* Focus Recommendation */}
              <div className="bg-amber-50 border border-amber-200/50 rounded-lg p-6">
                <h3 className="font-semibold text-amber-900 mb-2">
                  🎯 Focus First On
                </h3>
                <p className="text-amber-800 font-medium">{result.focusRecommendation}</p>
              </div>

              {/* Tasks */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Tasks to Do</h3>
                <div className="space-y-2">
                  {result.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-lg flex items-start gap-3"
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          result.priorities[idx] === 'High'
                            ? 'bg-red-100 text-red-700'
                            : result.priorities[idx] === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {result.priorities[idx]}
                      </span>
                      <p className="text-slate-900 font-medium flex-1">{task}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Why This Order?</h3>
                <p className="text-slate-700 text-sm">{result.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Brain Dumps */}
        {brainDumps.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Recent Brain Dumps
            </h2>
            <div className="space-y-4">
              {brainDumps.slice(0, 5).map((dump) => (
                <div key={dump.id} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">
                    {new Date(dump.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-slate-900 line-clamp-2">{dump.content}</p>
                  {dump.summary && (
                    <p className="text-sm text-blue-600 mt-2">
                      ✓ Organized
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
