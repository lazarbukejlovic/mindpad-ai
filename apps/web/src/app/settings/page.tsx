'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, Download, LogOut, Bot, Sparkles, Brain, ShieldCheck, CreditCard, Zap, Users, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { getToken, removeToken } from '@/lib/auth';
import { BillingStatus } from '@/types/index';
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

const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team' };
const PLAN_COLORS: Record<string, string> = {
  free: 'rgba(70,100,140,0.8)',
  pro: '#40b8ff',
  team: '#a78bfa',
};

const PLAN_FEATURES: Record<string, { unlocked: string[]; locked?: string[] }> = {
  free: {
    unlocked: ['10 active tasks', '3 brain dump extractions/day', '7-day focus history', 'Basic analytics', 'Core AI planning'],
    locked: ['Weekly AI review', 'Export summary', 'Saved execution plans', 'Priority insight', 'Team workspace'],
  },
  pro: {
    unlocked: ['100 active tasks', '50 brain dump extractions/day', '90-day focus history', 'Advanced analytics', 'Weekly AI review reports', 'Export productivity summary', 'Saved execution plans', 'Priority insight dashboard'],
  },
  team: {
    unlocked: ['500 active tasks', '200 brain dump extractions/day', '365-day focus history', 'All Pro features', 'Team workspace', 'Shared projects & activity feed', 'Team weekly AI report', 'Member invite & admin controls'],
  },
};

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]                       = useState('');
  const [name, setName]                         = useState('');
  const [avatarUrl, setAvatarUrl]               = useState('');
  const [authProvider, setAuthProvider]         = useState('');
  const [loading, setLoading]                   = useState(true);
  const [exportMsg, setExportMsg]               = useState('');
  const [defaultDuration, setDefaultDuration]   = useState('25');
  const [billing, setBilling]                   = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading]     = useState(false);
  const [billingMsg, setBillingMsg]             = useState('');
  const [upgradeLoading, setUpgradeLoading]     = useState<'pro' | 'team' | null>(null);
  const [portalLoading, setPortalLoading]       = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }

    ApiClient.getMe()
      .then(d => {
        setEmail(d.email);
        if (d.name) setName(d.name);
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
        if (d.authProvider) setAuthProvider(d.authProvider);
        try { localStorage.setItem('md:me', JSON.stringify({ email: d.email, name: d.name, avatarUrl: d.avatarUrl })); } catch {}
      })
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem('md:me') || 'null');
          if (cached?.email) setEmail(cached.email);
          if (cached?.name) setName(cached.name);
          if (cached?.avatarUrl) setAvatarUrl(cached.avatarUrl);
        } catch {}
      })
      .finally(() => setLoading(false));

    setBillingLoading(true);
    ApiClient.getBillingStatus()
      .then(b => setBilling(b))
      .catch(() => setBilling(null))
      .finally(() => setBillingLoading(false));

    const billingParam = searchParams.get('billing');
    if (billingParam === 'success') setBillingMsg('Your plan has been upgraded successfully.');
    if (billingParam === 'canceled') setBillingMsg('');
  }, [router, searchParams]);

  function handleExport() {
    setExportMsg('Data export is available in the full release. Your data is securely stored.');
    setTimeout(() => setExportMsg(''), 4000);
  }

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  async function handleUpgrade(plan: 'pro' | 'team') {
    setUpgradeLoading(plan);
    try {
      const { url } = await ApiClient.createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch {
      setBillingMsg('Could not start checkout. Please try again.');
    } finally {
      setUpgradeLoading(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { url } = await ApiClient.createPortalSession();
      if (url) window.location.href = url;
    } catch {
      setBillingMsg('Could not open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
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

  const plan = billing?.plan ?? 'free';
  const isPaid = plan === 'pro' || plan === 'team';
  const hasCustomer = billing && (billing.plan !== 'free' || billing.subscriptionStatus);

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
                {/* Avatar: Google photo or initials fallback */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    style={{
                      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                      objectFit: 'cover', border: '2px solid rgba(0,160,255,0.25)',
                      boxShadow: '0 0 24px rgba(0,120,255,0.2)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0080d8, #0055a8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: '#fff',
                    boxShadow: '0 0 24px rgba(0,120,255,0.25)',
                  }}>
                    {email ? email[0].toUpperCase() : '?'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Display name if available */}
                  {name && (
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(220,235,255,0.95)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </p>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(160,190,230,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                    {email}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge variant="success">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px rgba(34,197,94,0.7)' }} />
                      &nbsp;Active
                    </Badge>
                    {(authProvider === 'google' || authProvider === 'mixed') && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 99,
                        background: 'rgba(66,133,244,0.1)',
                        border: '1px solid rgba(66,133,244,0.25)',
                        color: 'rgba(120,170,255,0.9)',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 48 48" fill="none">
                          <path d="M47.532 24.552c0-1.636-.132-3.208-.382-4.728H24v9.02h13.192c-.57 3.064-2.296 5.66-4.888 7.402v6.152h7.912c4.628-4.264 7.316-10.548 7.316-17.846z" fill="#4285F4"/>
                          <path d="M24 48c6.636 0 12.196-2.2 16.264-5.952l-7.912-6.152c-2.196 1.472-5.004 2.34-8.352 2.34-6.428 0-11.876-4.34-13.824-10.172H2.024v6.352C6.076 42.628 14.444 48 24 48z" fill="#34A853"/>
                          <path d="M10.176 28.064A14.4 14.4 0 0 1 9.6 24c0-1.412.24-2.784.576-4.064v-6.352H2.024A23.978 23.978 0 0 0 0 24c0 3.876.924 7.548 2.024 10.416l8.152-6.352z" fill="#FBBC05"/>
                          <path d="M24 9.528c3.624 0 6.872 1.248 9.432 3.68l7.072-7.072C36.192 2.2 30.632 0 24 0 14.444 0 6.076 5.372 2.024 13.584l8.152 6.352C12.124 13.868 17.572 9.528 24 9.528z" fill="#EA4335"/>
                        </svg>
                        Google connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* ── Billing ── */}
            <div style={{ ...panel, marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,160,255,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={15} style={{ color: '#40b8ff' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180,210,240,0.9)' }}>Billing</span>
                </div>
                {!billingLoading && billing && (
                  <div style={{
                    padding: '3px 10px', borderRadius: 99,
                    background: plan === 'free' ? 'rgba(60,80,120,0.2)' : plan === 'team' ? 'rgba(120,80,200,0.12)' : 'rgba(0,120,255,0.1)',
                    border: `1px solid ${plan === 'free' ? 'rgba(80,110,160,0.2)' : plan === 'team' ? 'rgba(150,100,240,0.25)' : 'rgba(0,160,255,0.2)'}`,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                    color: PLAN_COLORS[plan],
                  }}>
                    {PLAN_LABELS[plan] ?? plan}
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 20px 20px' }}>
                {billingLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <Spinner size="sm" />
                  </div>
                ) : !billing || !billing.stripeConfigured ? (
                  <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.75)' }}>
                    Billing is not configured yet.
                  </p>
                ) : (
                  <>
                    {billingMsg && (
                      <div style={{
                        marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                        background: billingMsg.includes('successfully') ? 'rgba(0,180,100,0.08)' : 'rgba(220,60,60,0.08)',
                        border: `1px solid ${billingMsg.includes('successfully') ? 'rgba(0,200,100,0.2)' : 'rgba(220,60,60,0.2)'}`,
                        fontSize: 13,
                        color: billingMsg.includes('successfully') ? 'rgba(100,220,160,0.9)' : 'rgba(252,165,165,0.9)',
                      }}>
                        {billingMsg}
                      </div>
                    )}

                    {/* Plan details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: 'rgba(120,150,190,0.8)' }}>Current plan</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: PLAN_COLORS[plan] }}>
                          {PLAN_LABELS[plan] ?? plan}
                        </span>
                      </div>
                      {billing.subscriptionStatus && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: 'rgba(120,150,190,0.8)' }}>Status</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: billing.subscriptionStatus === 'active' ? 'rgba(100,220,160,0.9)' : 'rgba(252,200,100,0.9)', textTransform: 'capitalize' }}>
                            {billing.subscriptionStatus}
                          </span>
                        </div>
                      )}
                      {billing.currentPeriodEnd && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: 'rgba(120,150,190,0.8)' }}>
                            {billing.cancelAtPeriodEnd ? 'Access until' : 'Renews'}
                          </span>
                          <span style={{ fontSize: 13, color: 'rgba(180,210,240,0.8)' }}>
                            {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {billing.cancelAtPeriodEnd && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(220,150,30,0.08)', border: '1px solid rgba(220,150,30,0.18)', fontSize: 12, color: 'rgba(252,210,100,0.85)' }}>
                          Your subscription will not renew at the end of the current period.
                        </div>
                      )}
                    </div>

                    {/* Plan features */}
                    {(() => {
                      const features = PLAN_FEATURES[plan];
                      if (!features) return null;
                      return (
                        <div style={{ marginBottom: 18 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(80,120,170,0.7)', textTransform: 'uppercase', marginBottom: 10 }}>
                            Your features
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {features.unlocked.map(f => (
                              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'rgba(160,200,240,0.85)' }}>{f}</span>
                              </div>
                            ))}
                            {features.locked?.map(f => (
                              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Lock size={11} style={{ color: 'rgba(70,100,140,0.5)', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'rgba(70,100,140,0.5)' }}>{f}</span>
                              </div>
                            ))}
                          </div>
                          {plan === 'free' && (
                            <Link href="/pricing" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12,
                              fontSize: 12, fontWeight: 600, color: '#40b8ff', textDecoration: 'none',
                            }}>
                              Unlock all features <ChevronRight size={12} />
                            </Link>
                          )}
                        </div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {plan === 'free' && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleUpgrade('pro')}
                            disabled={upgradeLoading !== null}
                          >
                            {upgradeLoading === 'pro' ? <Spinner size="sm" /> : <Zap size={14} />}
                            Upgrade to Pro
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleUpgrade('team')}
                            disabled={upgradeLoading !== null}
                          >
                            {upgradeLoading === 'team' ? <Spinner size="sm" /> : <Users size={14} />}
                            Upgrade to Team
                          </Button>
                        </>
                      )}
                      {isPaid && (
                        <Button
                          variant="ghost"
                          onClick={handleManageBilling}
                          disabled={portalLoading}
                        >
                          {portalLoading ? <Spinner size="sm" /> : <CreditCard size={14} />}
                          Manage Billing
                        </Button>
                      )}
                      {!isPaid && hasCustomer && (
                        <Button
                          variant="ghost"
                          onClick={handleManageBilling}
                          disabled={portalLoading}
                        >
                          {portalLoading ? <Spinner size="sm" /> : <CreditCard size={14} />}
                          Manage Billing
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

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

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
