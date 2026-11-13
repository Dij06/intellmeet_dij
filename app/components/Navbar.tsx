'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  Video,
  LayoutGrid,
  Kanban,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  X,
  Radio,
  ArrowUpRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Meetings', shortcut: 'M', icon: LayoutGrid },
  { href: '/workspaces', label: 'Workspaces & Kanban', shortcut: 'W', icon: Kanban },
  { href: '/analytics', label: 'Analytics', shortcut: 'A', icon: LineChart },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'm' || e.key === 'M') {
        window.location.href = '/dashboard';
      } else if (e.key === 'w' || e.key === 'W') {
        window.location.href = '/workspaces';
      } else if (e.key === 'a' || e.key === 'A') {
        window.location.href = '/analytics';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-paper-50/95 backdrop-blur-md">
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6"
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-bold tracking-tight text-ink-950"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-paper-50 shadow-tactile-sm transition-transform group-hover:-translate-y-0.5">
              <Video className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-sans font-extrabold tracking-tight text-ink-950 text-lg">
              intell<span className="text-coral">meet</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded border border-ink-900/15 bg-paper-200/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-600">
              v2.0
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                    active
                      ? 'bg-ink-950 text-paper-50 shadow-tactile-sm'
                      : 'text-ink-700 hover:bg-paper-200/80 hover:text-ink-950'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span
                    className={`font-mono text-[9px] uppercase transition ${
                      active ? 'text-coral' : 'text-ink-400 group-hover:text-ink-600'
                    }`}
                  >
                    [{item.shortcut}]
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Live Pulse + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-paper-100 px-2.5 py-1 text-[11px] font-mono text-ink-600">
            <Radio className="h-3 w-3 text-emeraldBrand animate-pulse" />
            <span>P2P WebRTC Ready</span>
          </div>

          {session?.user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-ink-900/10">
              <div className="text-right">
                <p className="text-xs font-bold text-ink-950 leading-tight">
                  {session.user.name || session.user.email?.split('@')[0]}
                </p>
                <p className="font-mono text-[10px] text-ink-500">
                  {(session.user as { role?: string }).role || 'MEMBER'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1 rounded-lg border border-ink-900/20 bg-paper-50 px-2.5 py-1 text-xs font-medium text-ink-700 hover:border-ink-950 hover:text-ink-950 shadow-tactile-sm transition"
              >
                <LogOut className="h-3 w-3" aria-hidden="true" />
                Exit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-ink-900/10">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg border border-ink-950 bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-paper-50 shadow-tactile-sm hover:bg-ink-800 transition active:translate-x-0.5 active:translate-y-0.5"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg border border-ink-900/20 p-1.5 text-ink-900 hover:bg-paper-200 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-ink-900/10 bg-paper-50 px-4 py-3 space-y-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                  active ? 'bg-ink-950 text-paper-50' : 'text-ink-700 hover:bg-paper-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-400" />
              </Link>
            );
          })}
          <div className="pt-2 border-t border-ink-900/10">
            {session?.user ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-paper-200"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out ({session.user.name || session.user.email})
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-ink-950 py-2 text-xs font-semibold text-paper-50 shadow-tactile-sm"
              >
                <LogIn className="h-4 w-4" />
                Sign In / Demo Mode
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
