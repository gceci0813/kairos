'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

// ── SVG icons ──────────────────────────────────────────────────────────────────

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
function IconGlobe() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
    </svg>
  );
}
function IconSignal() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M16.364 3.636a1 1 0 00-1.414 1.414 7 7 0 010 9.9 1 1 0 001.414 1.414 9 9 0 000-12.728z" />
      <path d="M13.536 6.464a1 1 0 00-1.414 1.414 3 3 0 010 4.243 1 1 0 001.414 1.414 5 5 0 000-7.07z" />
      <path d="M5.05 6.464A1 1 0 003.636 7.88a5 5 0 000 7.07 1 1 0 001.414-1.414 3 3 0 010-4.243A1 1 0 005.05 6.464z" />
      <path d="M2.222 3.636A1 1 0 00.808 5.05a9 9 0 000 12.728 1 1 0 001.414-1.414 7 7 0 010-9.9 1 1 0 000-1.414l-.001-.414z" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}
function IconFileSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414v8.586a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
}
function IconWatchlist() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6zm-5 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm2 2a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
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
function IconCard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1V14a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0019 14V8.5zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.25-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
    </svg>
  );
}

// ── Nav items ──────────────────────────────────────────────────────────────────

const baseNavItems = [
  { label: 'Overview',  href: '/dashboard',          Icon: IconGrid                               },
  { label: 'ORACLE',    href: '/dashboard/oracle',   Icon: IconChart,  sub: 'Strategy Navigator'  },
  { label: 'SENTINEL',  href: '/dashboard/sentinel', Icon: IconEye,    sub: 'Horizon Watch'        },
  { label: 'ACTOR',     href: '/dashboard/actor',      Icon: IconUser,      sub: 'Intelligence Module'        },
  { label: 'WATCHLIST', href: '/dashboard/watchlist',  Icon: IconWatchlist,   sub: 'Sanctions & Most Wanted'    },
  { label: 'DOCUMENTS', href: '/dashboard/documents',  Icon: IconFileSearch,  sub: 'Intelligence Extraction'    },
  { label: 'Live Feeds',href: '/dashboard/live',       Icon: IconSignal,    sub: 'Real-Time Intel Hub'        },
  { label: 'Signals',   href: '/dashboard/map',      Icon: IconGlobe,  sub: 'Early Warning System' },
  { label: 'Reports',   href: '/dashboard/reports',  Icon: IconDoc                                },
  { label: 'Profile',   href: '/dashboard/profile',  Icon: IconCard, sub: 'My Account & Activity' },
  { label: 'Settings',  href: '/dashboard/settings', Icon: IconCog                                },
];

const adminNavItem = {
  label: 'Admin',
  href:  '/dashboard/admin',
  Icon:  IconShield,
  sub:   'Audit & Access Control',
};

// ── Role display helpers ───────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  admin:   'bg-red-100 text-red-700',
  analyst: 'bg-blue-100 text-blue-700',
  viewer:  'bg-slate-100 text-slate-600',
};

// ── Layout component ───────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<string>('analyst');
  const [userEmail, setUserEmail] = useState<string>('');

  // Fetch user's role on mount
  useEffect(() => {
    fetch('/api/admin/user-role')
      .then(r => r.json())
      .then(d => {
        if (d.role)  setRole(d.role);
        if (d.email) setUserEmail(d.email);
      })
      .catch(() => { /* silent — default stays 'analyst' */ });
  }, []);

  const navItems = role === 'admin'
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'K';

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
        <div className="h-[60px] border-b border-[#E2E8F0] flex items-center gap-3 px-4">
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
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, Icon, sub }) => {
            const isAdmin  = href === '/dashboard/admin';
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
                    ? isAdmin
                      ? 'bg-red-50 text-red-700'
                      : 'bg-[#EFF6FF] text-[#1D4ED8]'
                    : isAdmin
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}>
                <Icon />
                {!collapsed && (
                  <div className="min-w-0">
                    <div className={`text-[0.8rem] font-semibold leading-tight ${active ? (isAdmin ? 'text-red-700' : 'text-[#1D4ED8]') : ''}`}>
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
                <span className="text-[0.6rem] font-bold text-[#2563EB]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.75rem] font-semibold text-[#0F172A] truncate">
                  {userEmail || 'Analyst'}
                </div>
                <div className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${ROLE_BADGE[role] ?? ROLE_BADGE.analyst}`}>
                  {role.toUpperCase()}
                </div>
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
