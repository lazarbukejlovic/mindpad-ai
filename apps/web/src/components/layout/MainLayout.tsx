'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function MainLayout({
  children,
  showNav = true,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f3f0] to-[#f0ede9]">
      {showNav && (
        <nav className="bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] bg-clip-text text-transparent"
            >
              MindPad
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
