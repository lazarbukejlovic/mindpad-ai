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
  Zap,
  Users,
  Tag,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';
import DarkModeToggle from './DarkModeToggle';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/brain-dump', label: 'Brain Dump',  icon: Brain },
  { href: '/tasks',      label: 'Tasks',       icon: CheckSquare },
  { href: '/focus',      label: 'Focus',       icon: Timer },
  { href: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/team',       label: 'Team',        icon: Users },
  { href: '/settings',   label: 'Settings',    icon: Settings },
  { href: '/pricing',    label: 'Pricing',     icon: Tag },
];

/* Shared styles as constants to avoid repetition */
const SIDEBAR_BG  = 'rgba(3, 6, 14, 0.97)';
const SIDEBAR_BORDER = '1px solid rgba(0, 160, 255, 0.1)';
const ACTIVE_BG   = 'rgba(0, 130, 255, 0.1)';
const ACTIVE_SHADOW = 'inset 3px 0 0 rgba(0, 160, 255, 0.85), 0 0 16px rgba(0, 80, 200, 0.12)';

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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={active ? {
                color: '#60c8ff',
                backgroundColor: ACTIVE_BG,
                boxShadow: ACTIVE_SHADOW,
                fontWeight: 600,
              } : {
                color: 'rgba(130, 160, 200, 0.85)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = '#c0d8f0';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 100, 200, 0.06)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(130, 160, 200, 0.85)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon
                size={18}
                style={{ color: active ? '#40b8ff' : 'rgba(100, 140, 190, 0.8)', flexShrink: 0 }}
              />
              {label}
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: '#00c0ff', boxShadow: '0 0 6px rgba(0,200,255,0.8)' }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AppNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 z-20"
        style={{
          background: SIDEBAR_BG,
          borderRight: SIDEBAR_BORDER,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '4px 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo area */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: '1px solid rgba(0, 160, 255, 0.08)' }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: 'rgba(0, 130, 255, 0.14)',
                border: '1px solid rgba(0, 160, 255, 0.3)',
                boxShadow: '0 0 20px rgba(0, 120, 255, 0.2)',
              }}
            >
              <Brain size={18} style={{ color: '#40b8ff' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: '#d0e8ff' }}>MindPad</span>
                <span
                  className="text-[9px] font-bold tracking-wider uppercase rounded-full px-1.5 py-0.5"
                  style={{
                    color: '#40b8ff',
                    background: 'rgba(0, 160, 255, 0.12)',
                    border: '1px solid rgba(0, 160, 255, 0.25)',
                  }}
                >
                  AI
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap size={9} style={{ color: 'rgba(255, 185, 0, 0.7)' }} />
                <span className="text-[10px] tracking-wide" style={{ color: 'rgba(100, 140, 180, 0.7)' }}>
                  Workspace
                </span>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <NavItems pathname={pathname} />
        </nav>

        {/* Bottom utility */}
        <div
          className="px-3 pb-5 pt-4 space-y-1"
          style={{ borderTop: '1px solid rgba(0, 160, 255, 0.07)' }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
            <DarkModeToggle />
            <span className="text-xs" style={{ color: 'rgba(100, 140, 180, 0.6)' }}>Theme</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ color: 'rgba(130, 160, 200, 0.7)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#ff8080';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(130, 160, 200, 0.7)';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <nav
        className="md:hidden fixed top-0 left-0 right-0 z-20"
        style={{
          background: 'rgba(3, 6, 14, 0.97)',
          borderBottom: SIDEBAR_BORDER,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(0, 130, 255, 0.14)',
                border: '1px solid rgba(0, 160, 255, 0.28)',
              }}
            >
              <Brain size={15} style={{ color: '#40b8ff' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#d0e8ff' }}>MindPad</span>
            <span
              className="text-[9px] font-bold tracking-wider uppercase rounded-full px-1.5 py-0.5"
              style={{ color: '#40b8ff', background: 'rgba(0,160,255,0.12)', border: '1px solid rgba(0,160,255,0.22)' }}
            >AI</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(130, 160, 200, 0.8)' }}
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="md:hidden fixed left-0 top-0 h-full w-72 z-40 flex flex-col animate-slide-up"
            style={{
              background: SIDEBAR_BG,
              borderRight: SIDEBAR_BORDER,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '8px 0 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              className="flex items-center justify-between px-5 h-14"
              style={{ borderBottom: '1px solid rgba(0, 160, 255, 0.08)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,130,255,0.14)', border: '1px solid rgba(0,160,255,0.28)' }}
                >
                  <Brain size={15} style={{ color: '#40b8ff' }} />
                </div>
                <span className="text-base font-bold" style={{ color: '#d0e8ff' }}>MindPad</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'rgba(130, 160, 200, 0.7)' }}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <NavItems pathname={pathname} onClose={() => setMobileOpen(false)} />
            </nav>

            <div
              className="px-3 pb-6 pt-4 flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(0, 160, 255, 0.07)' }}
            >
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ color: 'rgba(130, 160, 200, 0.7)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#ff8080';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220,38,38,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(130, 160, 200, 0.7)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
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
