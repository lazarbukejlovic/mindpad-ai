import { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontWeight: 600,
  borderRadius: 10,
  transition: 'all 0.15s ease',
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
  fontFamily: 'inherit',
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #0080d8, #0055a8)',
    color: '#fff',
    boxShadow: '0 2px 16px rgba(0, 120, 255, 0.35)',
    border: '1px solid rgba(0, 160, 255, 0.3)',
  },
  ghost: {
    background: 'rgba(0, 80, 160, 0.08)',
    color: 'rgba(140, 180, 230, 0.9)',
    border: '1px solid rgba(0, 160, 255, 0.18)',
  },
  danger: {
    background: 'rgba(180, 30, 30, 0.75)',
    color: '#fff',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    boxShadow: '0 2px 12px rgba(220, 38, 38, 0.2)',
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12, height: 32 },
  md: { padding: '10px 16px', fontSize: 13, height: 40 },
  lg: { padding: '12px 24px', fontSize: 15, height: 48 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  style,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={className}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={isDisabled}
      onMouseEnter={e => {
        if (isDisabled) return;
        const el = e.currentTarget;
        if (variant === 'primary') {
          el.style.opacity = '0.9';
          el.style.boxShadow = '0 4px 24px rgba(0, 120, 255, 0.5)';
        } else if (variant === 'ghost') {
          el.style.background = 'rgba(0, 100, 200, 0.14)';
          el.style.color = 'rgba(180, 215, 255, 1)';
          el.style.borderColor = 'rgba(0, 160, 255, 0.3)';
        } else if (variant === 'danger') {
          el.style.background = 'rgba(200, 40, 40, 0.85)';
        }
      }}
      onMouseLeave={e => {
        if (isDisabled) return;
        const el = e.currentTarget;
        Object.assign(el.style, variantStyles[variant], sizeStyles[size]);
      }}
      {...props}
    >
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}
