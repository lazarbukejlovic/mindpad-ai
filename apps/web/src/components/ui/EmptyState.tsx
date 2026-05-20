import { type LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', marginBottom: 16,
        background: 'rgba(0, 80, 160, 0.1)',
        border: '1px solid rgba(0, 160, 255, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(0, 120, 255, 0.08)',
      }}>
        <Icon size={22} style={{ color: 'rgba(0, 160, 255, 0.6)' }} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(180, 210, 240, 0.88)', marginBottom: 6 }}>
        {heading}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: 'rgba(90, 120, 165, 0.85)', maxWidth: 280, marginBottom: 20, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
