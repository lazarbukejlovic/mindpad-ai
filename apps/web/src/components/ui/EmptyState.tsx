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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[rgb(var(--text-muted))]" />
      </div>
      <h3 className="text-base font-semibold text-[rgb(var(--text))] mb-1">{heading}</h3>
      {description && (
        <p className="text-sm text-[rgb(var(--text-muted))] max-w-xs mb-5">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
