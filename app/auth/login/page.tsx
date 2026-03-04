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
    <>
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
            placeholder="••••••••"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-4 py-3 text-base focus:outline-none focus:border-[#2563EB] transition-colors placeholder:text-[#CBD5E1]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white py-4 hover:bg-[#3B82F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-700">
          {loading ? 'Authenticating...' : 'Access Platform →'}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div>
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          <span className="font-display font-800 text-2xl tracking-[0.2em] text-[#0F172A]">KAIROS</span>
        </Link>
        <p className="mt-3 font-mono-custom text-[0.65rem] tracking-[0.25em] uppercase text-[#64748B]">
          Secure Platform Access
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display font-800 text-2xl text-[#0F172A] mb-1">Sign In</h1>
          <p className="text-[0.85rem] text-[#64748B]">Access your intelligence dashboard</p>
        </div>

        <Suspense fallback={<div className="text-[0.8rem] text-[#94A3B8]">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center">
          <p className="text-[0.8rem] text-[#64748B]">
            No account?{' '}
            <Link href="/auth/signup" className="text-[#2563EB] hover:text-[#3B82F6] transition-colors">
              Request Access
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center font-mono-custom text-[0.6rem] tracking-[0.15em] text-[#CBD5E1]">
        RESTRICTED ACCESS · KAIROS INTELLIGENCE PLATFORM
      </p>
    </div>
  );
}
