'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, AlertCircle, ArrowRight } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { saveToken } from '@/lib/auth';
import AIBrainVisual from '@/components/ui/AIBrainVisual';

const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [returnUrl, setReturnUrl]             = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('returnUrl') || '';
    // Only allow internal paths to prevent open redirect
    if (url.startsWith('/')) setReturnUrl(url);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6)          { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const result = await ApiClient.register(email, password);
      saveToken(result.token);
      try { localStorage.setItem('md:me', JSON.stringify(result.user)); } catch {}
      router.push(returnUrl || '/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already exists') || msg === 'User already exists') {
        setError('An account with this email already exists. Please sign in.');
      } else if (msg.includes('temporarily unavailable')) {
        setError('Service temporarily unavailable. Please try again in a moment.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(0,160,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(0,160,255,0.1), 0 0 20px rgba(0,160,255,0.07)';
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(0,160,255,0.14)';
    e.currentTarget.style.boxShadow   = 'none';
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 18px',
    borderRadius: 13, border: '1px solid rgba(0,160,255,0.14)',
    background: 'rgba(0,0,0,0.45)', color: '#d8eeff',
    fontSize: 14, outline: 'none', transition: 'all 0.2s',
  };

  return (
    <div className="min-h-screen text-[#e2e8f0] flex" style={{ position: 'relative', background: '#030609' }}>
      {/* Global ambient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,60,160,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(0,40,120,0.06) 0%, transparent 50%)',
      }} />

      {/* LEFT: Brain Visual */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-[0_0_58%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #030609 0%, #040c1e 45%, #030810 100%)' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,70,180,0.1) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,160,0,0.03) 0%, transparent 55%)' }} />

        {/* Outer decorative rings */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 680, height: 680, borderRadius: '50%',
          border: '1px solid rgba(0,130,255,0.06)',
          pointerEvents: 'none',
          animation: 'neural-node-pulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 580, height: 580, borderRadius: '50%',
          border: '1px solid rgba(255,170,0,0.05)',
          pointerEvents: 'none',
          animation: 'neural-node-pulse 6s ease-in-out infinite',
          animationDelay: '3s',
        }} />

        <div style={{ position: 'relative', width: 'min(560px, 88%)', aspectRatio: '1', zIndex: 1 }}>
          <AIBrainVisual />
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginTop: 40, textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(0,140,255,0.08)', border: '1px solid rgba(0,160,255,0.18)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c0ff', boxShadow: '0 0 8px rgba(0,200,255,0.9)', display: 'inline-block' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,200,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Neural Intelligence Engine
            </p>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(100,140,180,0.75)', lineHeight: 1.7, margin: 0 }}>
            Transform scattered thoughts into structured action with AI
          </p>
        </div>

        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(0,160,255,0.15) 30%, rgba(255,170,0,0.1) 60%, transparent)' }} />
      </div>

      {/* RIGHT: Auth Card */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative"
        style={{ background: 'linear-gradient(180deg, #030609 0%, #040810 100%)' }}
      >
        <div className="lg:hidden absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(0,80,180,0.07) 0%, transparent 60%)',
        }} />

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
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#40b8ff',
                background: 'rgba(0,160,255,0.12)', border: '1px solid rgba(0,160,255,0.28)',
                borderRadius: 99, padding: '3px 9px',
              }}>AI</span>
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center',
              background: 'linear-gradient(135deg, #e8f4ff 25%, #80b8e0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8,
            }}>
              Create your account
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.9)', textAlign: 'center' }}>
              Start organizing your thoughts with AI
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(5, 10, 22, 0.88)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(0,160,255,0.15)', borderRadius: 22, padding: '36px 32px',
            boxShadow: '0 0 0 1px rgba(0,160,255,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 100px rgba(0,40,140,0.08)',
          }}>
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

            {/* Google OAuth button */}
            <a
              href={GOOGLE_AUTH_URL}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', height: 48, borderRadius: 13, marginBottom: 20,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(200,220,245,0.9)', fontSize: 14, fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M47.532 24.552c0-1.636-.132-3.208-.382-4.728H24v9.02h13.192c-.57 3.064-2.296 5.66-4.888 7.402v6.152h7.912c4.628-4.264 7.316-10.548 7.316-17.846z" fill="#4285F4"/>
                <path d="M24 48c6.636 0 12.196-2.2 16.264-5.952l-7.912-6.152c-2.196 1.472-5.004 2.34-8.352 2.34-6.428 0-11.876-4.34-13.824-10.172H2.024v6.352C6.076 42.628 14.444 48 24 48z" fill="#34A853"/>
                <path d="M10.176 28.064A14.4 14.4 0 0 1 9.6 24c0-1.412.24-2.784.576-4.064v-6.352H2.024A23.978 23.978 0 0 0 0 24c0 3.876.924 7.548 2.024 10.416l8.152-6.352z" fill="#FBBC05"/>
                <path d="M24 9.528c3.624 0 6.872 1.248 9.432 3.68l7.072-7.072C36.192 2.2 30.632 0 24 0 14.444 0 6.076 5.372 2.024 13.584l8.152 6.352C12.124 13.868 17.572 9.528 24 9.528z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,160,255,0.1)' }} />
              <span style={{ fontSize: 11, color: 'rgba(60,90,130,0.7)', letterSpacing: '0.07em' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,160,255,0.1)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                  Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                  Password
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters" required autoComplete="new-password"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <p style={{ marginTop: 6, fontSize: 11, color: 'rgba(50,80,120,0.7)' }}>
                  Must be at least 6 characters
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(60,100,150,0.9)', textTransform: 'uppercase', marginBottom: 9 }}>
                  Confirm Password
                </label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="new-password"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
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
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 36px rgba(0,160,255,0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,120,240,0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {loading
                  ? <span style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <><span>Create Account</span><ArrowRight size={17} /></>
                }
              </button>
            </form>
          </div>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <p style={{ fontSize: 14, color: 'rgba(70,100,140,0.9)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#40b8ff', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                Sign in
              </Link>
            </p>
            <Link href="/" style={{ fontSize: 12, color: 'rgba(50,80,120,0.8)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(100,150,200,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(50,80,120,0.8)')}>
              ← Back to home
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
