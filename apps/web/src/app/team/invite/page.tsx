'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, CheckCircle2, AlertCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import { TeamRole } from '@/types/index';
import NeuralBackground from '@/components/ui/NeuralBackground';
import Button from '@/components/ui/Button';

const ROLE_LABELS: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

type InviteState =
  | { status: 'loading' }
  | { status: 'invalid' | 'expired' | 'revoked' | 'accepted' }
  | {
      status: 'valid';
      workspaceName: string;
      inviterName: string;
      invitedEmail: string;
      role: TeamRole;
      expiresAt: string;
      rawToken: string;
    };

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteState>({ status: 'loading' });
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [accepted, setAccepted] = useState(false);

  const rawToken = searchParams.get('token') || '';
  const currentUser = typeof window !== 'undefined' ? getUser() : null;
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!rawToken) {
      setInvite({ status: 'invalid' });
      return;
    }

    ApiClient.previewTeamInvite(rawToken)
      .then(res => {
        if (res.status === 'valid') {
          setInvite({
            status: 'valid',
            workspaceName: res.workspaceName!,
            inviterName: res.inviterName!,
            invitedEmail: res.invitedEmail!,
            role: res.role!,
            expiresAt: res.expiresAt!,
            rawToken,
          });
        } else {
          setInvite({ status: res.status });
        }
      })
      .catch(() => setInvite({ status: 'invalid' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawToken]);

  async function handleAccept() {
    if (invite.status !== 'valid') return;
    setAccepting(true);
    setAcceptError('');
    try {
      await ApiClient.acceptTeamInvite(invite.rawToken);
      setAccepted(true);
      setTimeout(() => router.push('/team'), 2000);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invite. Please try again.');
    } finally {
      setAccepting(false);
    }
  }

  const panel: React.CSSProperties = {
    background: 'rgba(5, 10, 22, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(0,160,255,0.15)',
    borderRadius: '1.25rem',
    padding: '40px 36px',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  };

  function renderContent() {
    if (invite.status === 'loading') {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Loader2 size={32} style={{ color: '#40b8ff', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)' }}>Loading invite details…</p>
        </div>
      );
    }

    if (accepted) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={30} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(180,210,240,0.95)', marginBottom: 10 }}>
            Welcome to the team!
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.75)', marginBottom: 20 }}>
            Redirecting you to the workspace…
          </p>
        </div>
      );
    }

    if (invite.status === 'expired') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={26} style={{ color: '#ffb700' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 10 }}>Invitation expired</h2>
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)', marginBottom: 24 }}>
            This invite link has expired. Ask the workspace owner to generate a new one.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.2)',
            color: '#40b8ff', textDecoration: 'none',
          }}>Go to Dashboard</Link>
        </div>
      );
    }

    if (invite.status === 'revoked') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={26} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 10 }}>Invitation revoked</h2>
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)', marginBottom: 24 }}>
            This invitation has been cancelled. Contact the workspace owner for a new invite.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.2)',
            color: '#40b8ff', textDecoration: 'none',
          }}>Go to Dashboard</Link>
        </div>
      );
    }

    if (invite.status === 'accepted') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={26} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 10 }}>Already accepted</h2>
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)', marginBottom: 24 }}>
            This invitation has already been accepted.
          </p>
          <Link href="/team" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'rgba(120,80,200,0.1)', border: '1px solid rgba(150,100,240,0.25)',
            color: '#a78bfa', textDecoration: 'none',
          }}>Open Team Workspace</Link>
        </div>
      );
    }

    if (invite.status === 'invalid') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={26} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(180,210,240,0.9)', marginBottom: 10 }}>Invalid invite link</h2>
          <p style={{ fontSize: 14, color: 'rgba(90,120,160,0.7)', marginBottom: 24 }}>
            This invite link is invalid or has already been used. Contact the workspace owner for a new link.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.2)',
            color: '#40b8ff', textDecoration: 'none',
          }}>Go to Dashboard</Link>
        </div>
      );
    }

    // Valid invite (TypeScript narrowed — all other statuses returned above)
    if (invite.status !== 'valid') return null;
    const { workspaceName, inviterName, invitedEmail, role } = invite;
    const loggedInEmail = (currentUser as any)?.email?.toLowerCase();
    const inviteEmail = invitedEmail?.toLowerCase();
    const emailMismatch = isLoggedIn && loggedInEmail && inviteEmail && loggedInEmail !== inviteEmail;
    const loginUrl = `/login?returnUrl=${encodeURIComponent(`/team/invite?token=${rawToken}`)}`;
    const registerUrl = `/register?returnUrl=${encodeURIComponent(`/team/invite?token=${rawToken}`)}`;

    return (
      <>
        {/* Workspace icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,100,240,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(120,80,200,0.2)',
          }}>
            <Users size={28} style={{ color: '#a78bfa' }} />
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'rgba(210,230,255,0.95)', marginBottom: 8,
          }}>
            You're invited to join
          </h1>
          <p style={{
            fontSize: 20, fontWeight: 700, color: '#a78bfa', marginBottom: 4,
          }}>{workspaceName}</p>
          <p style={{ fontSize: 13, color: 'rgba(90,120,160,0.8)' }}>
            Invited by <strong style={{ color: 'rgba(180,210,240,0.85)' }}>{inviterName}</strong>
            {' '}as <strong style={{ color: 'rgba(180,210,240,0.85)' }}>{ROLE_LABELS[role as TeamRole] ?? role}</strong>
          </p>
        </div>

        {/* Invite details */}
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(120,80,200,0.06)', border: '1px solid rgba(150,100,240,0.15)',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(130,160,200,0.7)', marginBottom: 4 }}>Invite sent to</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(200,220,245,0.9)' }}>{invitedEmail}</p>
        </div>

        {/* Email mismatch warning */}
        {emailMismatch && (
          <div style={{
            display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,160,160,0.9)', margin: 0 }}>
              You're logged in as <strong>{loggedInEmail}</strong>, but this invite was sent to <strong>{inviteEmail}</strong>.
              Please log in with the correct account.
            </p>
          </div>
        )}

        {/* Accept error */}
        {acceptError && (
          <div style={{
            display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,160,160,0.9)', margin: 0 }}>{acceptError}</p>
          </div>
        )}

        {/* CTA */}
        {!isLoggedIn ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={loginUrl} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 11, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              border: '1px solid rgba(124,58,237,0.5)', color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
            }}>
              Log in to accept <ArrowRight size={16} />
            </Link>
            <Link href={registerUrl} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 11, fontSize: 14, fontWeight: 600,
              background: 'rgba(0,100,200,0.08)', border: '1px solid rgba(0,160,255,0.2)',
              color: '#40b8ff', textDecoration: 'none',
            }}>
              Create account & accept
            </Link>
          </div>
        ) : emailMismatch ? (
          <Link href={loginUrl} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 11, fontSize: 15, fontWeight: 700,
            background: 'rgba(0,100,200,0.1)', border: '1px solid rgba(0,160,255,0.25)',
            color: '#40b8ff', textDecoration: 'none',
          }}>
            Log in as {inviteEmail} <ArrowRight size={16} />
          </Link>
        ) : (
          <Button
            onClick={handleAccept}
            loading={accepting}
            style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 15, borderRadius: 11 }}
          >
            Accept Invitation <ArrowRight size={16} />
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'rgb(3, 6, 14)', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px',
    }}>
      <NeuralBackground />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#d8eeff', letterSpacing: '-0.03em' }}>MindPad</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#40b8ff',
              background: 'rgba(0,160,255,0.12)', border: '1px solid rgba(0,160,255,0.28)',
              borderRadius: 99, padding: '3px 9px', letterSpacing: '0.1em',
            }}>AI</span>
          </Link>
        </div>

        <div style={panel}>
          {renderContent()}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function TeamInvitePage() {
  return (
    <Suspense fallback={
      <div style={{ background: 'rgb(3,6,14)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#40b8ff' }} />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
