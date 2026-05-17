'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, removeToken } from '@/lib/auth';
import { ApiClient } from '@/services/api';

interface UserProfile {
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadProfile();
  }, [router]);

  async function loadProfile() {
    try {
      const data = await ApiClient.getMe();
      setUser(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    removeToken();
    router.push('/');
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

        {/* Profile Section */}
        {user && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Email
                </label>
                <p className="text-slate-900 font-medium">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Account Status
                </label>
                <p className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Active
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">AI Preferences</h2>
          <p className="text-slate-600 mb-6">
            Customize how MindPad AI organizes your work and generates insights.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Auto-organize brain dumps</p>
                <p className="text-sm text-slate-600">
                  Automatically organize new brain dumps
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Daily morning brief</p>
                <p className="text-sm text-slate-600">
                  Get AI-generated morning briefs
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Focus recommendations</p>
                <p className="text-sm text-slate-600">
                  AI recommends what to focus on next
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Data & Export Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Data & Export</h2>

          <button className="w-full py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-900">
            Export Your Data
          </button>

          <p className="text-sm text-slate-600 mt-4">
            Download all your brain dumps, tasks, and analytics in JSON format.
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-red-50 rounded-xl p-8 border border-red-200/50 shadow-sm">
          <h2 className="text-xl font-bold text-red-900 mb-6">Account</h2>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Sign Out
          </button>

          <p className="text-sm text-red-800 mt-4">
            You'll need to sign in again to access your account.
          </p>
        </div>
      </div>
    </div>
  );
}
