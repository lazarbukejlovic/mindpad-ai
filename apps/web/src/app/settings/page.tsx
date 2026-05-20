'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Download, LogOut, Bot, Sparkles, Brain, ShieldCheck } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken, removeToken } from '@/lib/auth';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import DarkModeToggle from '@/components/layout/DarkModeToggle';
import NeuralBackground from '@/components/ui/NeuralBackground';

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1rem',
};

function SettingsCard({ title, children, icon: Icon }: {
  title: string; children: React.ReactNode; icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}) {
  return (
    <div style={{ ...panel, marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
      }}>
        {Icon && <Icon size={15} style={{ color: '#40b8ff' }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail]                   = useState('');
  const [loading, setLoading]               = useState(true);
  const [exportMsg, setExportMsg]           = useState('');
  const [defaultDuration, setDefaultDuration] = useState('25');

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    ApiClient.getMe()
      .then(d => setEmail(d.email))
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem('md:me') || 'null');
          if (cached?.email) setEmail(cached.email);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleExport() {
    setExportMsg('Data export is available in the full release. Your data is securely stored.');
    setTimeout(() => setExportMsg(''), 4000);
  }

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  const selectStyle: React.CSSProperties = {
    height: 38, padding: '0 12px', borderRadius: 9,
    border: '1px solid rgba(0,160,255,0.15)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(180,210,240,0.9)', fontSize: 13, outline: 'none', cursor: 'pointer',
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
        <NeuralBackground />
        <AppNav />
        <div className="md:pl-60" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      <AppNav />
      <div className="md:pl-60" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: 'rgba(0,130,255,0.12)', border: '1px solid rgba(0,160,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0,120,255,0.15)',
              }}>
                <Settings size={21} style={{ color: '#40b8ff' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #d8eeff 30%, #6098c8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 3,
                }}>Settings</h1>
                <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.85)' }}>
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* ── Account ── */}
            <SettingsCard title="Account" icon={ShieldCheck}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #0080d8, #0055a8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, color: '#fff',
                  boxShadow: '0 0 24px rgba(0,120,255,0.25)',
                }}>
                  {email ? email[0].toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(200,220,245,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                    {email}
                  </p>
                  <Badge variant="success">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px rgba(34,197,94,0.7)' }} />
                    &nbsp;Active
                  </Badge>
                </div>
              </div>
            </SettingsCard>

            {/* ── Preferences ── */}
            <SettingsCard title="Preferences" icon={Settings}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(180,210,240,0.9)', marginBottom: 3 }}>Dark Mode</p>
                    <p style={{ fontSize: 12, color: 'rgba(70,100,140,0.75)' }}>Toggle between light and dark theme</p>
                  </div>
                  <DarkModeToggle />
                </div>
                <div style={{ height: 1, background: 'rgba(0,160,255,0.07)', margin: '4px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(180,210,240,0.9)', marginBottom: 3 }}>Default Focus Duration</p>
                    <p style={{ fontSize: 12, color: 'rgba(70,100,140,0.75)' }}>Starting duration for new Pomodoro sessions</p>
                  </div>
                  <select value={defaultDuration} onChange={e => setDefaultDuration(e.target.value)} style={selectStyle}>
                    <option value="25">25 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>
            </SettingsCard>

            {/* ── AI Preferences ── */}
            <div style={{ ...panel, marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={15} style={{ color: '#40b8ff' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>AI Preferences</span>
                </div>
                <Badge variant="info">MindPad AI</Badge>
              </div>
              <div style={{ padding: '14px 20px 18px' }}>
                <p style={{ fontSize: 12, color: 'rgba(70,100,140,0.75)', marginBottom: 14 }}>
                  AI-powered features. Extended configuration coming in a future update.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: Brain,    label: 'Auto-organize brain dumps',      sub: 'Extract tasks when you save a dump',          enabled: true },
                    { icon: Sparkles, label: 'Smart task prioritization',       sub: 'AI suggests priority levels based on context', enabled: true },
                    { icon: Sparkles, label: 'Daily briefs',                    sub: 'Morning and evening AI summaries',            enabled: true },
                  ].map(({ icon: Icon, label, sub, enabled }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,160,255,0.09)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <Icon size={14} style={{ color: 'rgba(90,130,180,0.75)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(180,210,240,0.88)', marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 11, color: 'rgba(70,100,140,0.7)' }}>{sub}</p>
                        </div>
                      </div>
                      {/* Toggle indicator */}
                      <div style={{
                        width: 36, height: 20, borderRadius: 99, flexShrink: 0, marginLeft: 16,
                        background: enabled ? 'rgba(0,140,255,0.8)' : 'rgba(40,60,100,0.5)',
                        display: 'flex', alignItems: 'center', padding: '0 2px',
                        boxShadow: enabled ? '0 0 10px rgba(0,160,255,0.3)' : 'none',
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                          transform: enabled ? 'translateX(16px)' : 'translateX(0)',
                          transition: 'transform 0.2s',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Data & Export ── */}
            <SettingsCard title="Data & Export" icon={Download}>
              <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)', marginBottom: 14 }}>
                Export all your brain dumps, tasks, and focus sessions as JSON. Your data belongs to you.
              </p>
              <Button variant="ghost" onClick={handleExport}>
                <Download size={14} /> Export My Data
              </Button>
              {exportMsg && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(0,100,200,0.08)', borderLeft: '3px solid rgba(0,160,255,0.5)',
                  fontSize: 13, color: 'rgba(180,210,240,0.85)',
                }}>
                  {exportMsg}
                </div>
              )}
            </SettingsCard>

            {/* ── Danger Zone ── */}
            <div style={{
              ...panel,
              borderColor: 'rgba(220,38,38,0.25)',
              boxShadow: '0 0 0 1px rgba(220,38,38,0.05)',
            }}>
              <div style={{
                padding: '14px 20px 12px', borderBottom: '1px solid rgba(220,38,38,0.12)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(252,165,165,0.9)' }}>Danger Zone</span>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)', marginBottom: 16 }}>
                  Signing out will clear your local session. Your data is safely stored.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <Button variant="danger" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </Button>
                  <Button variant="ghost" disabled>
                    Delete Account
                    <Badge variant="default" className="ml-1">Coming soon</Badge>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
