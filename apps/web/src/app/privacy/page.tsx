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

export default function PrivacyPage() {
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
        }}>Privacy Policy</h1>
        <p style={{ ...p, marginBottom: 40, color: 'rgba(80,110,160,0.7)' }}>Last updated: May 2026</p>

        <div style={section}>
          <h2 style={h2Style}>1. What we collect</h2>
          <p style={p}>When you use MindPad AI, we collect the minimum information needed to operate the service:</p>
          <ul>
            <li style={li}><strong style={{ color: 'rgba(180,210,240,0.9)' }}>Account data</strong> — your email address and, if you choose, your name.</li>
            <li style={li}><strong style={{ color: 'rgba(180,210,240,0.9)' }}>Content you create</strong> — brain dumps, tasks, focus sessions, and notes you save inside the app.</li>
            <li style={li}><strong style={{ color: 'rgba(180,210,240,0.9)' }}>Usage data</strong> — feature interactions (e.g., sessions started, tasks completed) used to provide analytics within your own account.</li>
            <li style={li}><strong style={{ color: 'rgba(180,210,240,0.9)' }}>Authentication data</strong> — a hashed password (never stored in plain text), or a Google account identifier if you use Google sign-in.</li>
            <li style={li}><strong style={{ color: 'rgba(180,210,240,0.9)' }}>Billing identifiers</strong> — a Stripe customer ID linked to your account if you subscribe. We never store your card number or payment details.</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. How we use your data</h2>
          <p style={p}>Your data is used solely to provide and improve MindPad AI:</p>
          <ul>
            <li style={li}>Authenticate your account and keep your session secure.</li>
            <li style={li}>Store and retrieve your brain dumps, tasks, and focus history.</li>
            <li style={li}>Send your content to an AI service to extract tasks and generate planning suggestions when you request it.</li>
            <li style={li}>Process subscription payments through Stripe.</li>
            <li style={li}>Send transactional emails (password reset, email verification) through a secure email delivery service.</li>
          </ul>
          <p style={p}>We do not sell, rent, or share your personal data with third parties for advertising or marketing purposes.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. AI features and third-party processing</h2>
          <p style={p}>When you use AI features (brain dump organization, task extraction, planning suggestions), the text you submit is sent to an AI API provider for processing. This provider processes your content only to generate a response and does not use it to train AI models under our agreement.</p>
          <p style={p}>You should avoid entering sensitive personal information (medical, financial, legal, or third-party credentials) into AI-powered fields.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. Payment processing</h2>
          <p style={p}>All payment transactions are handled by Stripe, a PCI-compliant payment processor. MindPad AI never receives or stores your full card number, CVV, or bank account details. Stripe's privacy policy governs how your payment data is handled.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Data retention</h2>
          <p style={p}>Your account and content are retained for as long as your account is active. If you delete your account, your data will be removed from our systems within 30 days, except where retention is required by law or to resolve disputes.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. Your rights</h2>
          <p style={p}>You can export your data, update your account information, or request account deletion at any time through the Settings page or by contacting us. Depending on your jurisdiction, you may have additional rights under applicable data protection law.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. Cookies and local storage</h2>
          <p style={p}>MindPad AI stores your session token in browser local storage to keep you logged in. We do not use third-party advertising cookies. Basic, session-level data may be stored in cookies for authentication purposes.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>8. Contact</h2>
          <p style={p}>If you have questions about this policy or your data, contact us at the email address listed in your account settings or on the MindPad AI website.</p>
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
