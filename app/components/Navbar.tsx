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
  Sun,
  Moon,
  User,
  Check,
} from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';
import { useToast } from '@/app/components/Toast';

const navItems = [
  { href: '/dashboard', label: 'Meetings', shortcut: 'M', icon: LayoutGrid },
  { href: '/workspaces', label: 'Workspace', shortcut: 'W', icon: Kanban },
  { href: '/analytics', label: 'Analytics', shortcut: 'A', icon: LineChart },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (session?.user?.name) {
      setEditName(session.user.name);
    }
  }, [session]);

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Profile display name updated', 'success');
        setShowProfileModal(false);
        if (updateSession) {
          await updateSession({ name: editName.trim() });
        }
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('Network error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-page)]/90 backdrop-blur-md transition-colors duration-200">
      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-bold tracking-tight text-[var(--text-primary)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-page)] shadow-sm transition-transform group-hover:scale-105">
              <Video className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-sans font-bold tracking-tight text-lg text-[var(--text-primary)]">
              intell<span className="text-[var(--accent)]">meet</span>
            </span>
            <span className="hidden sm:inline-flex items-center rounded border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
              v2.0
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-[var(--text-primary)] text-[var(--bg-page)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] font-mono transition ${
                      active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]/50 group-hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    [{item.shortcut}]
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Status indicator + Theme toggle + Auth */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Status pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span>P2P WebRTC Ready</span>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--warning)]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
            )}
          </button>

          {/* User profile / Auth */}
          {session?.user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                title="Account Settings & Profile"
                className="text-right hover:opacity-80 transition group"
              >
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent)]">
                  {session.user.name || session.user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {(session.user as { role?: string }).role || 'MEMBER'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-md bg-[var(--text-primary)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu & Theme Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--warning)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-page)] px-4 py-3 space-y-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium ${
                  active
                    ? 'bg-[var(--text-primary)] text-[var(--bg-page)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="text-[10px] font-mono opacity-70">[{item.shortcut}]</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[var(--border)]">
            {session?.user ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
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
                className="flex items-center justify-center gap-2 rounded-md bg-[var(--text-primary)] py-2 text-xs font-medium text-[var(--bg-page)]"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In / Demo Mode</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Profile / Account Settings Modal */}
      {showProfileModal && session?.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Account Profile Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={session.user.email || ''}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)]/60 px-3 py-2 text-xs text-[var(--text-secondary)] cursor-not-allowed opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-[var(--text-secondary)]">
                <span>Account Role:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {(session.user as { role?: string }).role || 'MEMBER'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-1 rounded-lg bg-[var(--text-primary)] px-4 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 shadow-sm disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
