'use client';
export const dynamic = 'force-dynamic';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[0.78rem] font-medium text-[#374151] mb-1.5">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="analyst@organization.gov"
          className="w-full bg-white border border-[#D1D5DB] text-[#111827] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[0.78rem] font-medium text-[#374151]">
            Password
          </label>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full bg-white border border-[#D1D5DB] text-[#111827] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-md py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div>
      {/* Mobile logo */}
      <div className="auth-mobile-logo text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          <span className="font-display font-800 text-xl tracking-[0.2em] text-[#0F172A]">KAIROS</span>
        </Link>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="font-display font-800 text-[1.75rem] text-[#0F172A] mb-2 tracking-tight">
          Sign in to KAIROS
        </h1>
        <p className="text-sm text-[#6B7280]">
          Enter your credentials to access the intelligence platform.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-[#9CA3AF]">Loading...</div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#6B7280]">
          No account?{' '}
          <Link href="/auth/signup" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
            Request access
          </Link>
        </p>
      </div>

      <p className="mt-10 text-center font-mono-custom text-[0.6rem] tracking-[0.15em] uppercase text-[#D1D5DB]">
        Restricted · KAIROS Intelligence Platform
      </p>
    </div>
  );
}
