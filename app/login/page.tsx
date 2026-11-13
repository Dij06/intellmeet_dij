'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Sparkles, ArrowRight } from 'lucide-react';
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
      // Sign in automatically as built-in demo user
      const res = await signIn('credentials', {
        email: 'demo@intellmeet.com',
        redirect: false,
      });
      if (res?.ok) {
        showToast('Signed in as Demo User (Full Access)', 'success');
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
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border-2 border-ink-950 bg-paper-50 p-7 shadow-tactile-lg">
        {/* Header */}
        <div className="border-b border-ink-900/10 pb-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
              Authentication Portal
            </span>
            <span className="font-mono text-[10px] text-ink-500">JWT • Bcrypt • Neon</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
            {mode === 'login' ? 'Sign into IntellMeet' : 'Create an Account'}
          </h1>
          <p className="mt-1 text-xs text-ink-600">
            Access enterprise video rooms, AI summaries, and synced Kanban boards.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-ink-950 bg-paper-200 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`rounded-md py-1.5 text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-ink-950 text-paper-50 shadow-tactile-sm'
                : 'text-ink-700 hover:text-ink-950'
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
            className={`rounded-md py-1.5 text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-ink-950 text-paper-50 shadow-tactile-sm'
                : 'text-ink-700 hover:text-ink-950'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-coral bg-coral-subtle px-3 py-2 text-xs font-medium text-coral-dark"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="user-name"
                className="block font-mono text-[11px] font-bold uppercase text-ink-700"
              >
                Your Name
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" aria-hidden="true" />
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full rounded-lg border border-ink-900/30 bg-paper-50 py-2 pl-9 pr-3 text-xs font-medium text-ink-950 placeholder:text-ink-400 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="user-email"
              className="block font-mono text-[11px] font-bold uppercase text-ink-700"
            >
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" aria-hidden="true" />
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@team.com"
                className="w-full rounded-lg border border-ink-900/30 bg-paper-50 py-2 pl-9 pr-3 text-xs font-medium text-ink-950 placeholder:text-ink-400 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="user-password"
              className="block font-mono text-[11px] font-bold uppercase text-ink-700"
            >
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" aria-hidden="true" />
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-lg border border-ink-900/30 bg-paper-50 py-2 pl-9 pr-3 text-xs font-medium text-ink-950 placeholder:text-ink-400 focus:border-ink-950 focus:outline-none focus:ring-1 focus:ring-ink-950"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink-950 bg-ink-950 py-2.5 text-xs font-bold uppercase tracking-wider text-paper-50 shadow-tactile transition hover:bg-ink-800 disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <span>{mode === 'login' ? 'Authenticate' : 'Complete Registration'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Direct Link */}
        <div className="mt-5 border-t border-ink-900/10 pt-4">
          <p className="text-center font-mono text-[10px] text-ink-500 mb-2">
            EVALUATION / GUEST ACCESS
          </p>
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-950 bg-paper-100 py-2 text-xs font-bold text-ink-950 shadow-tactile-sm transition hover:bg-paper-200 active:translate-x-0.5 active:translate-y-0.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden="true" />
            <span>Launch Instant Demo Mode (No Sign-Up)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
