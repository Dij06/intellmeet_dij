'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Sparkles, ArrowRight, Video } from 'lucide-react';
import { useToast } from '@/app/components/Toast';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          showToast(data.error || 'Registration failed', 'error');
          setLoading(false);
          return;
        }
        showToast('Account created successfully! Signing in...', 'success');
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Check your password or use Demo mode.');
        showToast('Authentication failed', 'error');
      } else {
        showToast('Signed in successfully', 'success');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected network error occurred.');
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: 'demo@intellmeet.com',
        redirect: false,
      });
      if (res?.ok) {
        showToast('Signed in as Demo User', 'success');
      } else {
        showToast('Entering Demo Mode', 'info');
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-7 shadow-sm">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-page)]">
              <Video className="h-3.5 w-3.5" />
            </span>
            <span className="font-sans font-bold text-base text-[var(--text-primary)]">
              intell<span className="text-[var(--accent)]">meet</span>
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {mode === 'login' ? 'Sign into your account' : 'Create an account'}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Access enterprise meetings, transcription, and collaborative tasks.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`rounded-md py-1.5 text-xs font-medium transition ${
              mode === 'login'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`rounded-md py-1.5 text-xs font-medium transition ${
              mode === 'register'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="user-name"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="user-email"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="user-password"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-page)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] py-2.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>Instant Demo Mode (No sign-up required)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
