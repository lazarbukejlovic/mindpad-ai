'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Users, Brain, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/services/api';
import { isAuthenticated } from '@/lib/auth';
import { useBilling } from '@/hooks/useBilling';
import AppNav from '@/components/layout/AppNav';
import NeuralBackground from '@/components/ui/NeuralBackground';
import Spinner from '@/components/ui/Spinner';

const panel: React.CSSProperties = {
  background: 'rgba(5, 10, 22, 0.82)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,160,255,0.12)',
  borderRadius: '1.25rem',
};

const FREE_FEATURES = [
  '10 active tasks',
  '3 brain dump extractions/day',
  '7-day focus history',
  'Basic analytics',
  'Core AI planning',
];

const PRO_FEATURES = [
  '100 active tasks',
  '50 brain dump extractions/day',
  '90-day focus history',
  'Advanced analytics + trend charts',
  'Weekly AI review reports',
  'Export productivity summary',
  'Saved execution plans',
  'Priority insight dashboard',
  'Advanced AI planning',
];

const TEAM_FEATURES = [
  '500 active tasks',
  '200 brain dump extractions/day',
  '365-day focus history',
  'All Pro features',
  'Team workspace (up to 10 members)',
  'Shared projects & activity feed',
  'Team weekly AI report',
  'Member invite & admin controls',
  'Team analytics dashboard',
];

function CheckItem({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: 'rgba(0,160,255,0.12)', border: '1px solid rgba(0,160,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={10} style={{ color: '#40b8ff' }} />
      </div>
      <span style={{ fontSize: 13, color: 'rgba(160,200,240,0.85)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { plan: currentPlan, billing } = useBilling();
  const [upgradeLoading, setUpgradeLoading] = useState<'pro' | 'team' | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleUpgrade(plan: 'pro' | 'team') {
    if (!isAuthenticated()) { router.push('/register'); return; }
    setUpgradeLoading(plan);
    setMsg('');
    try {
      const { url } = await ApiClient.createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch {
      setMsg('Could not start checkout. Please try again.');
    } finally {
      setUpgradeLoading(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setMsg('');
    try {
      const { url } = await ApiClient.createPortalSession();
      if (url) window.location.href = url;
    } catch {
      setMsg('Could not open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  const isLoggedIn = !!isAuthenticated();
  const isPaid = currentPlan === 'pro' || currentPlan === 'team';

  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', position: 'relative' }}>
      <NeuralBackground />
      {isLoggedIn && <AppNav />}
      <div className={isLoggedIn ? 'md:pl-60' : ''} style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">

            {/* ── Header ── */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              {!isLoggedIn && (
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, color: 'rgba(100,150,200,0.7)', textDecoration: 'none' }}>
                  ← Back to home
                </Link>
              )}
              <h1 style={{
                fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg, #d8eeff 30%, #4080c0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 14,
              }}>
                Simple, honest pricing
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(90,130,180,0.85)', maxWidth: 480, margin: '0 auto' }}>
                Start free. Upgrade when you need more.
              </p>
            </div>

            {msg && (
              <div style={{
                textAlign: 'center', marginBottom: 24, padding: '10px 20px', borderRadius: 10,
                background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.2)',
                fontSize: 13, color: '#fca5a5',
              }}>
                {msg}
              </div>
            )}

            {/* ── Plan cards ── */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

              {/* Free */}
              <div style={{
                ...panel,
                border: currentPlan === 'free' ? '2px solid rgba(0,160,255,0.35)' : '1px solid rgba(0,160,255,0.12)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ padding: '24px 24px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Brain size={18} style={{ color: 'rgba(100,150,200,0.7)' }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(160,200,240,0.9)' }}>Free</span>
                    {currentPlan === 'free' && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(0,130,255,0.1)', border: '1px solid rgba(0,160,255,0.2)',
                        color: '#40b8ff', letterSpacing: '0.05em',
                      }}>CURRENT</span>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(200,225,250,0.95)' }}>$0</span>
                    <span style={{ fontSize: 14, color: 'rgba(80,120,170,0.7)', marginLeft: 4 }}>/month</span>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    {FREE_FEATURES.map(f => <CheckItem key={f} text={f} />)}
                  </div>
                </div>
                <div style={{ padding: '0 24px 24px', marginTop: 'auto' }}>
                  {isLoggedIn ? (
                    <div style={{
                      width: '100%', padding: '10px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,160,255,0.1)',
                      fontSize: 13, color: 'rgba(80,120,170,0.6)', fontWeight: 500,
                    }}>
                      {currentPlan === 'free' ? 'Your current plan' : 'Downgrade via billing portal'}
                    </div>
                  ) : (
                    <Link href="/register" style={{
                      display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10,
                      background: 'rgba(0,130,255,0.08)', border: '1px solid rgba(0,160,255,0.2)',
                      fontSize: 13, fontWeight: 700, color: '#40b8ff', textDecoration: 'none',
                    }}>
                      Get started free
                    </Link>
                  )}
                </div>
              </div>

              {/* Pro */}
              <div style={{
                ...panel,
                border: currentPlan === 'pro'
                  ? '2px solid rgba(0,160,255,0.5)'
                  : '1px solid rgba(0,160,255,0.25)',
                boxShadow: '0 0 40px rgba(0,100,255,0.12)',
                display: 'flex', flexDirection: 'column', position: 'relative' as const,
              }}>
                <div style={{
                  position: 'absolute' as const, top: -1, left: '50%', transform: 'translateX(-50%)',
                  padding: '3px 14px', borderRadius: '0 0 10px 10px',
                  background: 'linear-gradient(135deg, #0080d8, #0055a8)',
                  fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.08em',
                }}>MOST POPULAR</div>
                <div style={{ padding: '28px 24px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Zap size={18} style={{ color: '#40b8ff' }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#60c8ff' }}>Pro</span>
                    {currentPlan === 'pro' && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(0,130,255,0.1)', border: '1px solid rgba(0,160,255,0.2)',
                        color: '#40b8ff', letterSpacing: '0.05em',
                      }}>CURRENT</span>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(200,225,250,0.95)' }}>$9</span>
                    <span style={{ fontSize: 14, color: 'rgba(80,120,170,0.7)', marginLeft: 4 }}>/month</span>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    {PRO_FEATURES.map(f => <CheckItem key={f} text={f} />)}
                  </div>
                </div>
                <div style={{ padding: '0 24px 24px', marginTop: 'auto' }}>
                  {currentPlan === 'pro' ? (
                    <div style={{
                      width: '100%', padding: '10px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(0,130,255,0.08)', border: '1px solid rgba(0,160,255,0.2)',
                      fontSize: 13, color: '#40b8ff', fontWeight: 600,
                    }}>Your current plan</div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('pro')}
                      disabled={upgradeLoading !== null}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #0080d8, #0055a8)',
                        border: '1px solid rgba(0,180,255,0.3)',
                        fontSize: 13, fontWeight: 700, color: '#fff', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 4px 16px rgba(0,100,220,0.25)',
                        opacity: upgradeLoading !== null ? 0.7 : 1,
                      }}
                    >
                      {upgradeLoading === 'pro' ? <Spinner size="sm" /> : <Zap size={14} />}
                      {isLoggedIn ? 'Upgrade to Pro' : 'Get Pro'}
                    </button>
                  )}
                </div>
              </div>

              {/* Team */}
              <div style={{
                ...panel,
                border: currentPlan === 'team'
                  ? '2px solid rgba(120,80,200,0.5)'
                  : '1px solid rgba(120,80,200,0.2)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ padding: '24px 24px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Users size={18} style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd' }}>Team</span>
                    {currentPlan === 'team' && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.25)',
                        color: '#a78bfa', letterSpacing: '0.05em',
                      }}>CURRENT</span>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(200,225,250,0.95)' }}>$29</span>
                    <span style={{ fontSize: 14, color: 'rgba(80,120,170,0.7)', marginLeft: 4 }}>/month</span>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    {TEAM_FEATURES.map(f => <CheckItem key={f} text={f} />)}
                  </div>
                </div>
                <div style={{ padding: '0 24px 24px', marginTop: 'auto' }}>
                  {currentPlan === 'team' ? (
                    <div style={{
                      width: '100%', padding: '10px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(120,80,200,0.08)', border: '1px solid rgba(150,100,240,0.2)',
                      fontSize: 13, color: '#a78bfa', fontWeight: 600,
                    }}>Your current plan</div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('team')}
                      disabled={upgradeLoading !== null}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(120,60,200,0.8), rgba(80,30,160,0.8))',
                        border: '1px solid rgba(150,100,240,0.3)',
                        fontSize: 13, fontWeight: 700, color: '#e0d0ff', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        opacity: upgradeLoading !== null ? 0.7 : 1,
                      }}
                    >
                      {upgradeLoading === 'team' ? <Spinner size="sm" /> : <Users size={14} />}
                      {isLoggedIn ? 'Upgrade to Team' : 'Get Team'}
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* ── Footer trust line ── */}
            <div style={{ textAlign: 'center', marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} style={{ color: 'rgba(70,100,140,0.6)' }} />
                <span style={{ fontSize: 12, color: 'rgba(70,100,140,0.6)' }}>
                  Payments are securely processed by{' '}
                  <span style={{ color: 'rgba(100,140,200,0.7)', fontWeight: 600 }}>Stripe</span>
                  . MindPad AI never stores your card details.
                </span>
              </div>
              {isLoggedIn && isPaid && billing?.canManageBilling && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(0,100,200,0.08)', border: '1px solid rgba(0,160,255,0.18)',
                    fontSize: 12, fontWeight: 600, color: 'rgba(100,160,220,0.85)',
                    opacity: portalLoading ? 0.7 : 1,
                  }}
                >
                  {portalLoading ? <Spinner size="sm" /> : null}
                  Manage billing
                </button>
              )}
              <p style={{ fontSize: 12, color: 'rgba(50,80,120,0.5)' }}>
                All plans include secure data storage and access to MindPad AI.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
