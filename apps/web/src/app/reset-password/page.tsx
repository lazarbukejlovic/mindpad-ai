'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Brain, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ApiClient } from '@/services/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!token) { setError('Reset token is missing. Please use the link from your email.'); return; }

    setLoading(true);
    try {
      await ApiClient.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid') || msg.includes('expired') || msg.includes('INVALID_RESET')) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else if (msg.includes('timed out') || msg.includes('Unable to connect') || msg.includes('temporarily unavailable')) {
        setError('Unable to connect. Please check your connection and try again.');
      } else {
        setError(msg || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 18px',
    borderRadius: 13, border: '1px solid rgba(0,160,255,0.14)',
    background: 'rgba(0,0,0,0.45)', color: '#d8eeff',
    fontSize: 14, outline: 'none', transition: 'all 0.2s',
  };

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(0,160,255,0.5)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.1), 0 0 20px rgba(0,160,255,0.07)';
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(0,160,255,0.14)';
    e.currentTarget.style.boxShadow = 'none';
  }

  return (
    <div className="min-h-screen text-[#e2e8f0] flex" style={{ position: 'relative', background: '#030609' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,60,160,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(0,40,120,0.06) 0%, transparent 50%)',
      }} />

      {/* LEFT panel */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-[0_0_58%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #030609 0%, #040c1e 45%, #030810 100%)' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,70,180,0.1) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 680, height: 680, borderRadius: '50%', border: '1px solid rgba(0,130,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(0,130,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(0,140,255,0.08)', border: '1px solid rgba(0,160,255,0.18)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c0ff', boxShadow: '0 0 8px rgba(0,200,255,0.9)', display: 'inline-block' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,200,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Secure Password Reset
            </p>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#d8eeff', letterSpacing: '-0.03em', marginBottom: 14 }}>
            Set a new password
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(100,140,180,0.75)', lineHeight: 1.7, margin: 0 }}>
            Choose a strong password to protect your MindPad AI workspace.
          </p>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,160,255,0.15) 30%, rgba(255,170,0,0.1) 60%, transparent)' }} />
      </div>

      {/* RIGHT: Form */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative"
        style={{ background: 'linear-gradient(180deg, #030609 0%, #040810 100%)' }}
      >
        <div className="lg:hidden absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(0,80,180,0.07) 0%, transparent 60%)' }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(0,120,255,0.15) 0%, rgba(0,80,180,0.1) 100%)',
              border: '1.5px solid rgba(0,160,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
              boxShadow: '0 0 40px rgba(0,140,255,0.22), 0 0 0 8px rgba(0,140,255,0.04)',
            }}>
              <Brain size={28} color="#40b8ff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#d8eeff' }}>MindPad</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#40b8ff', background: 'rgba(0,160,255,0.12)', border: '1px solid rgba(0,160,255,0.28)', borderRadius: 99, padding: '3px 9px' }}>AI</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', background: 'linear-gradient(135deg, #e8f4ff 25%, #80b8e0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
              New Password
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.9)', textAlign: 'center' }}>
              Enter and confirm your new password
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(5, 10, 22, 0.88)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(0,160,255,0.15)', borderRadius: 22, padding: '36px 32px',
            boxShadow: '0 0 0 1px rgba(0,160,255,0.05), 0 32px 80px rgba(0,0,0,0.8)',
          }}>
            {!token ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: 14, color: '#fca5a5', marginBottom: 20 }}>
                  Missing reset token. Please use the link from your email.
                </p>
                <Link href="/forgot-password" style={{ fontSize: 14, fontWeight: 600, color: '#40b8ff', textDecoration: 'none' }}>
                  Request a new link
                </Link>
              </div>
            ) : done ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={24} color="#22c55e" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#d8eeff', marginBottom: 12 }}>Password updated!</h2>
                <p style={{ fontSize: 14, color: 'rgba(130,170,220,0.85)', lineHeight: 1.6, marginBottom: 24 }}>
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #0092f0 0%, #0056b8 100%)',
                    border: '1px solid rgba(0,180,255,0.35)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(0,120,240,0.3)',
                  }}
                >
                  Sign In <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    borderRadius: 12, background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5',
                    fontSize: 13, marginBottom: 24,
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                      New Password
                    </label>
                    <input
                      type="password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters" required autoComplete="new-password"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    <p style={{ marginTop: 6, fontSize: 11, color: 'rgba(50,80,120,0.7)' }}>Must be at least 6 characters</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                      Confirm Password
                    </label>
                    <input
                      type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" required autoComplete="new-password"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                      width: '100%', height: 50, marginTop: 6, borderRadius: 14,
                      border: '1px solid rgba(0,180,255,0.35)',
                      background: loading ? 'rgba(0,80,180,0.3)' : 'linear-gradient(135deg, #0092f0 0%, #0056b8 100%)',
                      color: '#fff', fontSize: 15, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 4px 24px rgba(0,120,240,0.3)',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 6px 36px rgba(0,160,255,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,120,240,0.3)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {loading
                      ? <span style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <><span>Set New Password</span><ArrowRight size={17} /></>
                    }
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
            <Link href="/login" style={{ fontSize: 12, color: 'rgba(50,80,120,0.8)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(100,150,200,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(50,80,120,0.8)')}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(60,90,130,0.7) }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
