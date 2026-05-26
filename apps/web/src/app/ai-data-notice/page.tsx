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

const callout: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 10,
  background: 'rgba(0,100,200,0.07)',
  border: '1px solid rgba(0,160,255,0.12)',
  fontSize: 14,
  lineHeight: 1.75,
  color: 'rgba(140,185,240,0.9)',
  marginBottom: 20,
};

export default function AiDataNoticePage() {
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
        }}>AI Data Notice</h1>
        <p style={{ ...p, marginBottom: 24, color: 'rgba(80,110,160,0.7)' }}>Last updated: May 2026</p>

        <div style={callout}>
          MindPad AI uses AI to help you organize your thoughts and prioritize your work. This notice explains what data the AI features process, how it is handled, and what you should know before using them.
        </div>

        <div style={section}>
          <h2 style={h2Style}>What the AI processes</h2>
          <p style={p}>When you use an AI-powered feature — such as brain dump organization, task extraction, morning briefs, or the AI planning assistant — the text you have entered is sent to an AI service for processing. This includes:</p>
          <ul>
            <li style={li}>The content of your brain dump when you click "Organize with AI."</li>
            <li style={li}>Your task list context when you request planning suggestions, focus recommendations, or evening summaries.</li>
            <li style={li}>Questions you type in the AI assistant chat.</li>
          </ul>
          <p style={p}>Only the content relevant to the specific request is sent. Your account email, payment information, and authentication credentials are never included in AI requests.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>How your content is handled</h2>
          <p style={p}>Content sent to the AI service is processed to generate a response and is not used to train AI models under our agreement with the provider. The provider operates under a data processing agreement with appropriate safeguards.</p>
          <p style={p}>We do not sell or share your content with any third party for purposes unrelated to generating AI responses.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>AI responses are suggestions, not advice</h2>
          <p style={p}>All AI-generated content in MindPad AI — including task suggestions, priority recommendations, planning briefs, and execution plans — is provided for productivity assistance only.</p>
          <ul>
            <li style={li}>AI suggestions may be incomplete, inaccurate, or contextually wrong.</li>
            <li style={li}>Do not rely on MindPad AI for medical, legal, financial, or other professional advice.</li>
            <li style={li}>You are responsible for reviewing and acting on any suggestion the AI provides.</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>What you should not enter</h2>
          <p style={p}>Avoid entering the following into AI-powered fields:</p>
          <ul>
            <li style={li}>Passwords, API keys, or authentication credentials.</li>
            <li style={li}>Sensitive personal information about yourself or others (e.g., medical conditions, financial account numbers).</li>
            <li style={li}>Confidential business information that you are not authorized to share with a third-party service.</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Offline fallback</h2>
          <p style={p}>If the AI service is unavailable, MindPad AI falls back to a local, rule-based mode that extracts tasks without sending any data externally. You will see an "Offline mode" indicator when this is active.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Your control</h2>
          <p style={p}>AI processing only occurs when you explicitly trigger an AI feature. Saving a brain dump without organizing it, or managing tasks manually, does not send any data to the AI service. You are always in control of when AI is invoked.</p>
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
