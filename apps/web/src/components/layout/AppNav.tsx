'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Brain,
  CheckSquare,
  Timer,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';
import DarkModeToggle from './DarkModeToggle';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/brain-dump', label: 'Brain Dump',  icon: Brain },
  { href: '/tasks',      label: 'Tasks',       icon: CheckSquare },
  { href: '/focus',      label: 'Focus',       icon: Timer },
  { href: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/settings',   label: 'Settings',    icon: Settings },
];

function NavItems({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-[rgb(var(--brand)/0.12)] text-[rgb(var(--brand))]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]'
              }`}
              style={active ? { backgroundColor: 'rgb(var(--brand) / 0.1)' } : {}}
            >
              <Icon size={18} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] z-20">
        <div className="px-5 py-5 border-b border-[rgb(var(--border))]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain size={20} className="text-brand-500 flex-shrink-0" />
            <div>
              <span className="text-base font-bold text-[rgb(var(--text))]">MindPad</span>
              <span className="block text-[10px] font-medium text-[rgb(var(--text-muted))] tracking-widest uppercase">
                AI Workspace
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <NavItems pathname={pathname} />
        </nav>

        <div className="px-3 pb-5 pt-4 border-t border-[rgb(var(--border))] space-y-1">
          <DarkModeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-20 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain size={18} className="text-brand-500" />
            <span className="text-base font-bold text-[rgb(var(--text))]">MindPad</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))]"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-full w-72 bg-[rgb(var(--surface))] z-40 flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 h-14 border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-brand-500" />
                <span className="text-base font-bold text-[rgb(var(--text))]">MindPad</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <NavItems pathname={pathname} onClose={() => setMobileOpen(false)} />
            </nav>

            <div className="px-3 pb-6 pt-4 border-t border-[rgb(var(--border))] flex items-center gap-2">
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
