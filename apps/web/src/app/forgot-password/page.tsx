'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Brain, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ApiClient } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await ApiClient.forgotPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('timed out') || msg.includes('Unable to connect') || msg.includes('temporarily unavailable')) {
        setError('Unable to connect. Please check your connection and try again.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-[#e2e8f0] flex" style={{ position: 'relative', background: '#030609' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,60,160,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(0,40,120,0.06) 0%, transparent 50%)',
      }} />

      {/* LEFT: Brain Visual Panel (desktop only) */}
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
              Secure Account Recovery
            </p>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#d8eeff', letterSpacing: '-0.03em', marginBottom: 14 }}>
            Forgot your password?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(100,140,180,0.75)', lineHeight: 1.7, margin: 0 }}>
            Enter your email and we&apos;ll send you a secure reset link valid for 30 minutes.
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
              Reset Password
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.9)', textAlign: 'center' }}>
              We&apos;ll email you a secure reset link
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(5, 10, 22, 0.88)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(0,160,255,0.15)', borderRadius: 22, padding: '36px 32px',
            boxShadow: '0 0 0 1px rgba(0,160,255,0.05), 0 32px 80px rgba(0,0,0,0.8)',
          }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={24} color="#22c55e" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#d8eeff', marginBottom: 12 }}>Check your inbox</h2>
                <p style={{ fontSize: 14, color: 'rgba(130,170,220,0.85)', lineHeight: 1.6, marginBottom: 24 }}>
                  If <strong style={{ color: '#d8eeff' }}>{email}</strong> has an account, you&apos;ll receive a reset link shortly. Check your spam folder if it doesn&apos;t arrive.
                </p>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 14, fontWeight: 600, color: '#40b8ff', textDecoration: 'none',
                }}>
                  ← Back to sign in
                </Link>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                      Email Address
                    </label>
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required autoComplete="email"
                      style={{
                        width: '100%', height: 48, padding: '0 18px',
                        borderRadius: 13, border: '1px solid rgba(0,160,255,0.14)',
                        background: 'rgba(0,0,0,0.45)', color: '#d8eeff',
                        fontSize: 14, outline: 'none', transition: 'all 0.2s',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,160,255,0.5)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,160,255,0.1), 0 0 20px rgba(0,160,255,0.07)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,160,255,0.14)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
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
                      : <><span>Send Reset Link</span><ArrowRight size={17} /></>
                    }
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Link href="/login" style={{ fontSize: 14, color: 'rgba(70,100,140,0.9)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#40b8ff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(70,100,140,0.9)')}>
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
