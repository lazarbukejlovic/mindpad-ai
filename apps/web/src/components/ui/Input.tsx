import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-[rgb(var(--text-muted))]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full px-3 rounded-lg border text-sm outline-none transition-all
            bg-[rgb(var(--surface))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))]
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
                : 'border-[rgb(var(--border))] focus:border-[rgb(var(--brand))] focus:ring-2 focus:ring-[rgb(var(--brand)/0.2)]'
            } ${className}`}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{hint}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
