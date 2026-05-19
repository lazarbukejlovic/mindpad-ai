import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

export default function Card({ children, title, action, className = '' }: CardProps) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
