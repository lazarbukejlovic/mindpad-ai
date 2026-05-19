import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export default function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName = 'text-brand-500',
}: KPICardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
          {label}
        </span>
        <Icon size={18} className={iconClassName} />
      </div>
      <p className="text-2xl font-bold text-[rgb(var(--text))]">{value}</p>
      {sub && <p className="text-xs mt-0.5 text-[rgb(var(--text-muted))]">{sub}</p>}
    </div>
  );
}
