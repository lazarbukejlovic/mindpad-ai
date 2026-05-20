import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export default function Card({ children, title, action, className = '' }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(5, 10, 22, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 160, 255, 0.12)',
        borderRadius: '1rem',
        padding: '20px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {title && (
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(180, 210, 240, 0.9)' }}>{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
