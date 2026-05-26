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

export default function TermsPage() {
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
        }}>Terms of Service</h1>
        <p style={{ ...p, marginBottom: 40, color: 'rgba(80,110,160,0.7)' }}>Last updated: May 2026</p>

        <div style={section}>
          <h2 style={h2Style}>1. Acceptance of terms</h2>
          <p style={p}>By creating an account or using MindPad AI, you agree to these Terms of Service. If you do not agree, do not use the service. These terms apply to all users, including free and paid plan subscribers.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. Description of service</h2>
          <p style={p}>MindPad AI is a productivity workspace that helps you capture brain dumps, extract actionable tasks using AI, manage focus sessions, and track your progress. The service is provided on an as-is basis and features may change over time.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. Account responsibilities</h2>
          <ul>
            <li style={li}>You are responsible for keeping your login credentials secure.</li>
            <li style={li}>You must be at least 16 years old to create an account.</li>
            <li style={li}>Each account is for one individual user. Sharing accounts is not permitted.</li>
            <li style={li}>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. Acceptable use</h2>
          <p style={p}>You may not use MindPad AI to:</p>
          <ul>
            <li style={li}>Violate any applicable law or regulation.</li>
            <li style={li}>Attempt to gain unauthorized access to the service or other users' accounts.</li>
            <li style={li}>Use automated scripts or bots to scrape or overload the service.</li>
            <li style={li}>Submit content that is illegal, harmful, or infringes on third-party rights.</li>
          </ul>
          <p style={p}>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Subscription and billing</h2>
          <p style={p}>Paid plans are billed on a monthly recurring basis. Subscriptions automatically renew unless canceled before the renewal date. You can manage or cancel your subscription at any time through the billing portal accessible from Settings.</p>
          <p style={p}>Prices are stated in USD. We reserve the right to change pricing with at least 30 days' notice to existing subscribers.</p>
          <p style={p}>Payment is processed securely by Stripe. MindPad AI does not store your payment card details.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. Refunds</h2>
          <p style={p}>Our refund policy is available at <Link href="/refund-policy" style={{ color: '#40b8ff', textDecoration: 'none' }}>mindpadai.com/refund-policy</Link>. Refunds are handled on a case-by-case basis within the guidelines described there.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. Intellectual property</h2>
          <p style={p}>All content you create in MindPad AI (brain dumps, tasks, notes) remains yours. You grant MindPad AI a limited license to store and process your content to provide the service, including sending it to AI processing services where needed.</p>
          <p style={p}>The MindPad AI name, logo, and software are owned by MindPad AI and may not be copied or used without permission.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>8. Disclaimer of warranties</h2>
          <p style={p}>MindPad AI is provided "as is" without warranties of any kind. AI-generated suggestions are for productivity assistance only and may be incomplete or inaccurate. We do not guarantee uninterrupted or error-free service.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>9. Limitation of liability</h2>
          <p style={p}>To the maximum extent permitted by law, MindPad AI shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid in the 12 months prior to the claim.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>10. Changes to these terms</h2>
          <p style={p}>We may update these terms from time to time. Continued use of the service after changes take effect constitutes acceptance of the updated terms. We will notify users of material changes by email or an in-app notice.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>11. Governing law</h2>
          <p style={p}>These terms are governed by the laws of the jurisdiction in which MindPad AI is incorporated, without regard to conflict of law provisions.</p>
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
