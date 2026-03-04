'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '◎' },
  { label: 'ORACLE', href: '/dashboard/oracle', icon: '△', sub: 'Strategy Navigator' },
  { label: 'SENTINEL', href: '/dashboard/sentinel', icon: '◈', sub: 'Horizon Watch' },
  { label: 'ACTOR', href: '/dashboard/actor', icon: '◆', sub: 'Intelligence Module' },
  { label: 'Reports', href: '/dashboard/reports', icon: '▷' },
  { label: 'Settings', href: '/dashboard/settings', icon: '○' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-300 shadow-sm`}>
        {/* Logo */}
        <div className="h-16 border-b border-[#E2E8F0] flex items-center px-4 gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 flex-shrink-0">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          {!collapsed && (
            <span className="font-display font-800 tracking-[0.2em] text-[#0F172A] text-lg">KAIROS</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-[#94A3B8] hover:text-[#2563EB] transition-colors text-xs">
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-3 transition-all duration-200 group rounded-sm ${
                  active
                    ? 'bg-[#DBEAFE] border-l-2 border-[#2563EB] text-[#1D4ED8]'
                    : 'border-l-2 border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}>
                <span className={`text-sm flex-shrink-0 ${active ? 'text-[#2563EB]' : 'text-[#94A3B8] group-hover:text-[#2563EB]'} transition-colors`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <div>
                    <div className="font-mono-custom text-[0.75rem] tracking-[0.15em] uppercase">{item.label}</div>
                    {item.sub && <div className="text-[0.65rem] text-[#94A3B8] mt-0.5">{item.sub}</div>}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-[#E2E8F0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0 rounded-sm">
              <span className="font-display text-[0.65rem] text-[#2563EB]">GC</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-mono-custom text-[0.7rem] tracking-[0.1em] text-[#0F172A] truncate">Analyst</div>
                <div className="text-[0.65rem] text-[#94A3B8]">Active Session</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={signOut} title="Sign Out"
                className="text-[#94A3B8] hover:text-[#DC2626] transition-colors text-xs flex-shrink-0">
                ⏻
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="alert-dot" />
            <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B]">
              Live Intelligence Feed
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono-custom text-[0.7rem] tracking-[0.15em] text-[#94A3B8]">
              {new Date().toUTCString().slice(0, 25)} UTC
            </span>
            <Link href="/" className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#64748B] hover:text-[#2563EB] transition-colors">
              ← Platform
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
