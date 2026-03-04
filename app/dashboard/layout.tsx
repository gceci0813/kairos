'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

// SVG icon components
function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.24a1 1 0 000 1.962l1.192.24a1 1 0 01.785.785l.24 1.192a1 1 0 001.962 0l.24-1.192a1 1 0 01.785-.785l1.192-.24a1 1 0 000-1.962l-1.192-.24a1 1 0 01-.785-.785l-.24-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.184a1 1 0 01.633.632l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
}
function IconCog() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.11l-2.5 2.5a.75.75 0 000 1.08l2.5 2.5a.75.75 0 101.004-1.11l-1.048-1.08h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
    </svg>
  );
}
function IconChevron({ right }: { right: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      {right
        ? <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        : <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
      }
    </svg>
  );
}

const navItems = [
  { label: 'Overview', href: '/dashboard', Icon: IconGrid },
  { label: 'ORACLE', href: '/dashboard/oracle', Icon: IconChart, sub: 'Strategy Navigator' },
  { label: 'SENTINEL', href: '/dashboard/sentinel', Icon: IconEye, sub: 'Horizon Watch' },
  { label: 'ACTOR', href: '/dashboard/actor', Icon: IconUser, sub: 'Intelligence Module' },
  { label: 'Reports', href: '/dashboard/reports', Icon: IconDoc },
  { label: 'Settings', href: '/dashboard/settings', Icon: IconCog },
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
    <div className="flex min-h-screen bg-[#F1F5F9]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[60px]' : 'w-[240px]'} flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-200 shadow-sm`}>
        {/* Logo */}
        <div className={`h-[60px] border-b border-[#E2E8F0] flex items-center gap-3 px-4`}>
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 flex-shrink-0">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          {!collapsed && (
            <span className="font-display font-800 tracking-[0.2em] text-[#0F172A] text-base flex-1">KAIROS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-[#94A3B8] hover:text-[#475569] transition-colors p-1 rounded hover:bg-[#F1F5F9]">
            <IconChevron right={collapsed} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map(({ label, href, Icon, sub }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-md transition-all duration-150 ${
                  collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}>
                <Icon />
                {!collapsed && (
                  <div className="min-w-0">
                    <div className={`text-[0.8rem] font-semibold leading-tight ${active ? 'text-[#1D4ED8]' : ''}`}>
                      {label}
                    </div>
                    {sub && (
                      <div className="text-[0.65rem] text-[#94A3B8] leading-tight mt-0.5">{sub}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-[#E2E8F0]" />

        {/* User section */}
        <div className={`p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors">
              <IconLogout />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                <span className="text-[0.6rem] font-bold text-[#2563EB]">K</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.75rem] font-semibold text-[#0F172A] truncate">Analyst</div>
                <div className="text-[0.65rem] text-[#94A3B8]">Active session</div>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors flex-shrink-0">
                <IconLogout />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[60px] border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse flex-shrink-0" />
            <span className="font-mono-custom text-[0.68rem] tracking-[0.18em] uppercase text-[#64748B]">
              Live Intelligence Feed
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono-custom text-[0.68rem] tracking-[0.1em] text-[#94A3B8] hidden sm:block">
              {new Date().toUTCString().slice(0, 25)} UTC
            </span>
            <Link
              href="/"
              className="text-[0.75rem] text-[#64748B] hover:text-[#2563EB] transition-colors font-medium">
              ← Home
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
