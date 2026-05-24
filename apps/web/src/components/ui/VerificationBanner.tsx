'use client';

import { useState } from 'react';
import { MailCheck, X } from 'lucide-react';
import { ApiClient } from '@/services/api';

interface Props {
  email: string;
  authProvider?: string;
  emailVerified?: boolean;
}

export default function VerificationBanner({ email, authProvider, emailVerified }: Props) {
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError]       = useState('');

  // Only show for pure email accounts that are unverified, not dismissed
  if (dismissed) return null;
  if (emailVerified) return null;
  if (authProvider === 'google') return null;

  async function handleResend() {
    setError('');
    setSending(true);
    try {
      await ApiClient.sendVerificationEmail();
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already verified') || msg.includes('ALREADY_VERIFIED')) {
        setSent(true);
      } else {
        setError('Could not send email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', gap: 12, flexWrap: 'wrap',
      background: 'rgba(0,100,220,0.08)',
      border: '1px solid rgba(0,160,255,0.18)',
      borderRadius: 12,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <MailCheck size={15} style={{ color: '#40b8ff', flexShrink: 0 }} />
        {sent ? (
          <span style={{ fontSize: 13, color: 'rgba(180,220,255,0.9)' }}>
            Verification email sent to <strong>{email}</strong>. Check your inbox.
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'rgba(140,180,230,0.85)' }}>
            Please verify your email address <strong style={{ color: 'rgba(180,220,255,0.9)' }}>{email}</strong>.
          </span>
        )}
        {error && <span style={{ fontSize: 12, color: '#fca5a5' }}>{error}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            style={{
              fontSize: 12, fontWeight: 600, color: '#40b8ff',
              background: 'rgba(0,160,255,0.1)', border: '1px solid rgba(0,160,255,0.25)',
              borderRadius: 8, padding: '5px 12px', cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1, transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {sending ? 'Sending…' : 'Resend email'}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(90,120,160,0.7)', padding: 4, display: 'flex', alignItems: 'center',
          }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
