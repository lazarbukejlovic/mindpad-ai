import Link from 'next/link';
import { Brain } from 'lucide-react';

const section: React.CSSProperties = {
  marginBottom: 32,
};

const h2Style: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: 'rgba(200,225,250,0.95)',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid rgba(0,160,255,0.08)',
};

const p: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  color: 'rgba(120,160,210,0.85)',
  marginBottom: 10,
};

const li: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  color: 'rgba(120,160,210,0.85)',
  marginBottom: 4,
  paddingLeft: 16,
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'rgb(3, 6, 14)', color: '#fff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Brain size={18} color="#0c92e8" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(180,210,240,0.9)' }}>MindPad AI</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(80,120,180,0.7)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #d8eeff 30%, #4080c0 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>Refund Policy</h1>
        <p style={{ ...p, marginBottom: 40, color: 'rgba(80,110,160,0.7)' }}>Last updated: May 2026</p>

        <div style={section}>
          <h2 style={h2Style}>Our commitment</h2>
          <p style={p}>We want you to feel confident when subscribing to MindPad AI. If you are not satisfied with your purchase, we will do our best to make it right.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>14-day refund window</h2>
          <p style={p}>If you subscribe to a paid plan and request a refund within <strong style={{ color: 'rgba(200,225,250,0.9)' }}>14 days of your first payment</strong>, we will issue a full refund, no questions asked.</p>
          <p style={p}>This applies to first-time purchases only. Subsequent billing cycles after the initial 14-day period are non-refundable.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>After the refund window</h2>
          <p style={p}>Refunds after the 14-day window are evaluated case by case. We will consider refunds for:</p>
          <ul>
            <li style={li}>A documented technical failure that prevented you from using the service.</li>
            <li style={li}>A billing error (duplicate charge, wrong plan billed).</li>
          </ul>
          <p style={p}>We do not offer prorated refunds for unused portions of a billing period when you choose to cancel mid-cycle.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Free plan</h2>
          <p style={p}>The Free plan is free of charge and there is nothing to refund. You can use MindPad AI for free for as long as you like without entering payment details.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>How to cancel</h2>
          <p style={p}>You can cancel your subscription at any time from the <strong style={{ color: 'rgba(200,225,250,0.9)' }}>Settings → Billing → Manage Billing</strong> section. After cancellation, your paid access continues until the end of the current billing period.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>How to request a refund</h2>
          <p style={p}>To request a refund, contact us with the email address associated with your account and a brief description of your request. We aim to process all refund requests within 5 business days.</p>
          <p style={p}>Approved refunds are returned to your original payment method via Stripe and typically appear within 5–10 business days depending on your bank.</p>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center' }}>
          {[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/refund-policy', label: 'Refund Policy' },
            { href: '/ai-data-notice', label: 'AI Data Notice' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(50,80,120,0.7)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
