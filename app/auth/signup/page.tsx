'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-center w-12 h-12 bg-green-50 border border-green-200 rounded-full mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display font-800 text-2xl text-[#0F172A] mb-3 text-center tracking-tight">
          Check your email
        </h2>
        <p className="text-sm text-[#6B7280] text-center mb-8">
          A confirmation link has been sent to <strong className="text-[#111827]">{email}</strong>. Click it to activate your account.
        </p>
        <Link
          href="/auth/login"
          className="block w-full text-center border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-md py-2.5 hover:bg-[#F9FAFB] transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-10">
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
          Create your account
        </h1>
        <p className="text-sm text-[#6B7280]">
          Set up your credentials to access the intelligence platform.
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
          <label className="block text-[0.78rem] font-medium text-[#374151] mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="w-full bg-white border border-[#D1D5DB] text-[#111827] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-md py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-10 text-center font-mono-custom text-[0.6rem] tracking-[0.15em] uppercase text-[#D1D5DB]">
        Restricted · KAIROS Intelligence Platform
      </p>
    </div>
  );
}
