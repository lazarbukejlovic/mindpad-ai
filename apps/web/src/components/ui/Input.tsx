import { InputHTMLAttributes, forwardRef, CSSProperties } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const inputBase: CSSProperties = {
  height: 40,
  width: '100%',
  padding: '0 12px',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  background: 'rgba(3, 6, 14, 0.6)',
  color: 'rgba(200, 220, 245, 0.92)',
  fontFamily: 'inherit',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const borderStyle: CSSProperties = error
      ? { border: '1px solid rgba(239, 68, 68, 0.6)' }
      : { border: '1px solid rgba(0, 160, 255, 0.18)' };

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 6, color: 'rgba(100, 140, 190, 0.75)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={className}
          style={{ ...inputBase, ...borderStyle, ...style }}
          onFocus={e => {
            if (error) {
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.8)';
              e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.12)';
            } else {
              e.target.style.borderColor = 'rgba(0, 160, 255, 0.45)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 120, 255, 0.1)';
            }
          }}
          onBlur={e => {
            e.target.style.boxShadow = 'none';
            e.target.style.borderColor = error
              ? 'rgba(239, 68, 68, 0.6)'
              : 'rgba(0, 160, 255, 0.18)';
          }}
          {...props}
        />
        {hint && !error && (
          <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(80, 110, 160, 0.7)' }}>{hint}</p>
        )}
        {error && (
          <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(239, 68, 68, 0.85)' }}>{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
