'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Video,
  LayoutDashboard,
  Kanban,
  BarChart3,
  LogIn,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Meetings', icon: LayoutDashboard },
  { href: '/workspaces', label: 'Workspaces & Kanban', icon: Kanban },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/40">
            <Video className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            Intell<span className="text-indigo-400">Meet</span>
          </span>
          <span className="hidden rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI v2.0
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Controls */}
        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-white">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-[11px] text-slate-400">
                  {(session.user as { role?: string }).role || 'MEMBER'}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/20">
                Demo Mode Ready
              </span>
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-900 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out ({session.user.name || session.user.email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
