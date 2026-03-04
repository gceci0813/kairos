'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-[#E2E8F0] shadow-sm ${
      scrolled ? 'py-4 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]' : 'py-6 bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
              <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
              <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
              <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-display font-800 text-xl tracking-[0.2em] text-[#0F172A] group-hover:text-[#3B82F6] transition-colors">
            KAIROS
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {['Platform', 'Products', 'Clients', 'Intelligence'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase text-[#475569] hover:text-[#3B82F6] transition-colors duration-300">
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login"
            className="font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase text-[#475569] hover:text-[#3B82F6] transition-colors">
            Sign In
          </Link>
          <Link href="/auth/signup"
            className="font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white px-5 py-2.5 hover:bg-[#3B82F6] transition-colors duration-300">
            Request Access
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-[#475569]" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="w-6 flex flex-col gap-1.5">
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}/>
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`}/>
            <span className={`block h-px bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}/>
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] px-6 py-6 flex flex-col gap-6">
          {['Platform', 'Products', 'Clients', 'Intelligence'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase text-[#475569]"
              onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
          <Link href="/auth/signup" className="font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white px-5 py-3 text-center">
            Request Access
          </Link>
        </div>
      )}
    </nav>
  );
}
