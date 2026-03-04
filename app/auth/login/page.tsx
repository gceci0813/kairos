'use client';
export const dynamic = 'force-dynamic';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resendSent, setResendSent]     = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsConfirm(false);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        // Detect email-not-confirmed case
        if (
          authError.message.toLowerCase().includes('email not confirmed') ||
          authError.message.toLowerCase().includes('email_not_confirmed') ||
          (authError as { code?: string }).code === 'email_not_confirmed'
        ) {
          setNeedsConfirm(true);
        } else if (
          authError.message.toLowerCase().includes('invalid') ||
          authError.message.toLowerCase().includes('credentials')
        ) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendSent(false);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.resend({ type: 'signup', email });
      setResendSent(true);
    } catch {
      // silent
    }
  };

  // Email confirmation prompt
  if (needsConfirm) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5">✉</span>
            <div>
              <p className="font-semibold text-amber-800 text-base mb-1">Confirm your email first</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                A confirmation link was sent to <strong>{email}</strong> when you signed up.
                Click that link, then return here to sign in.
              </p>
            </div>
          </div>
        </div>

        {resendSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            ✓ Confirmation email resent to {email}
          </div>
        ) : (
          <button
            onClick={handleResend}
            className="w-full border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-md py-2.5 hover:bg-[#F9FAFB] transition-colors">
            Resend confirmation email
          </button>
        )}

        <button
          onClick={() => { setNeedsConfirm(false); setError(''); }}
          className="w-full text-sm text-[#6B7280] hover:text-[#374151] transition-colors py-1">
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#374151] mb-2">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full bg-white border border-[#D1D5DB] text-[#111827] rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#374151] mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Your password"
          className="w-full bg-white border border-[#D1D5DB] text-[#111827] rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-base font-semibold rounded-lg py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-1">
        {loading ? 'Signing in…' : 'Sign In'}
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

      <div className="mb-8">
        <h1 className="text-3xl font-display font-800 text-[#0F172A] mb-2 tracking-tight">
          Sign in
        </h1>
        <p className="text-base text-[#6B7280]">
          Access your intelligence dashboard.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-[#9CA3AF]">Loading…</div>}>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-[#6B7280]">
        No account?{' '}
        <Link href="/auth/signup" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors">
          Create one
        </Link>
      </p>

      <p className="mt-10 text-center text-[0.65rem] font-mono-custom tracking-[0.15em] uppercase text-[#D1D5DB]">
        Restricted · KAIROS Intelligence Platform
      </p>
    </div>
  );
}
