import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  accentColor?: string;
}

export default function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor = '#00a0ff',
}: KPICardProps) {
  return (
    <div style={{
      background: 'rgba(5, 10, 22, 0.80)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 160, 255, 0.14)',
      borderRadius: '1rem',
      padding: '18px 20px 16px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* top accent line using the card's accent color */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'rgba(100, 140, 190, 0.75)',
        }}>
          {label}
        </span>
        <div style={{
          width: 30, height: 30, borderRadius: 10, flexShrink: 0,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 10px ${accentColor}1a`,
        }}>
          <Icon size={14} style={{ color: accentColor }} />
        </div>
      </div>
      <p style={{
        fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
        color: 'rgba(220, 235, 255, 0.97)', fontVariantNumeric: 'tabular-nums',
        marginBottom: sub ? 6 : 0,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: 'rgba(80, 110, 160, 0.8)', lineHeight: 1.4 }}>{sub}</p>
      )}
    </div>
  );
}
