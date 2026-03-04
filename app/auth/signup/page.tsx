'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

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
      <div className="text-center">
        <div className="bg-white border border-[#E2E8F0] p-10 shadow-sm">
          <div className="w-12 h-12 bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6 rounded-sm">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-800 text-xl text-[#0F172A] mb-2">Check Your Email</h2>
          <p className="text-[0.85rem] text-[#64748B] mb-6">
            A confirmation link has been sent to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#2563EB] hover:text-[#3B82F6] transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          <span className="font-display font-800 text-2xl tracking-[0.2em] text-[#0F172A]">KAIROS</span>
        </Link>
        <p className="mt-3 font-mono-custom text-[0.65rem] tracking-[0.25em] uppercase text-[#64748B]">
          Create Account
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display font-800 text-2xl text-[#0F172A] mb-1">Create Account</h1>
          <p className="text-[0.85rem] text-[#64748B]">Set up your KAIROS access credentials</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 px-4 py-3 text-[0.8rem] text-red-700 font-mono-custom">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#475569] block mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-4 py-3 text-base focus:outline-none focus:border-[#2563EB] transition-colors placeholder:text-[#CBD5E1]"
            />
          </div>
          <div>
            <label className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#475569] block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-4 py-3 text-base focus:outline-none focus:border-[#2563EB] transition-colors placeholder:text-[#CBD5E1]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white py-4 hover:bg-[#3B82F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-700">
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center">
          <p className="text-[0.8rem] text-[#64748B]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#2563EB] hover:text-[#3B82F6] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
