'use client';
import { useState, useEffect, useCallback } from 'react';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, Role } from '@/lib/rbac-types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  module: 'oracle' | 'sentinel' | 'actor';
  action: string;
  input_summary: Record<string, unknown>;
  created_at: string;
}

interface UserRoleEntry {
  user_id: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  oracle:   'bg-purple-50 text-purple-700 border-purple-200',
  sentinel: 'bg-blue-50   text-blue-700   border-blue-200',
  actor:    'bg-amber-50  text-amber-700  border-amber-200',
};

const MODULE_LABELS: Record<string, string> = {
  oracle:   'ORACLE',
  sentinel: 'SENTINEL',
  actor:    'ACTOR',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function labelClass(base: string) {
  return `text-xs font-bold tracking-wide px-2.5 py-1 rounded-full border ${base}`;
}

// ── Admin Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab]             = useState<'audit' | 'users'>('audit');
  const [myRole, setMyRole]       = useState<Role | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Audit log state
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal]   = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsModule, setLogsModule] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  // Users state
  const [users, setUsers]         = useState<UserRoleEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editRole, setEditRole]   = useState<Role>('analyst');
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const LIMIT = 50;

  // ── Fetch own role ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/user-role')
      .then(r => r.json())
      .then(d => {
        if (d.role) setMyRole(d.role as Role);
        else setForbidden(true);
      })
      .catch(() => setForbidden(true));
  }, []);

  // ── Fetch audit logs ───────────────────────────────────────
  const fetchLogs = useCallback(async (offset = 0, module = '') => {
    setLogsLoading(true);
    const params = new URLSearchParams({
      limit:  String(LIMIT),
      offset: String(offset),
    });
    if (module) params.set('module', module);

    try {
      const r = await fetch(`/api/admin/audit-logs?${params}`);
      if (r.status === 403) { setForbidden(true); return; }
      const d = await r.json();
      setLogs(d.logs ?? []);
      setLogsTotal(d.total ?? 0);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // ── Fetch users ────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const r = await fetch('/api/admin/user-role', { method: 'POST' });
      if (r.status === 403) { setForbidden(true); return; }
      const d = await r.json();
      setUsers(d.users ?? []);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (myRole !== 'admin') return;
    if (tab === 'audit') fetchLogs(logsOffset, logsModule);
    if (tab === 'users') fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, myRole]);

  const handleModuleFilter = (mod: string) => {
    setLogsModule(mod);
    setLogsOffset(0);
    fetchLogs(0, mod);
  };

  const handlePage = (dir: 'prev' | 'next') => {
    const next = dir === 'next' ? logsOffset + LIMIT : logsOffset - LIMIT;
    setLogsOffset(next);
    fetchLogs(next, logsModule);
  };

  const handleSaveRole = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const r = await fetch('/api/admin/user-role', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ target_user_id: editTarget, role: editRole }),
      });
      const d = await r.json();
      if (d.success) {
        setSaveMsg('Role updated.');
        setEditTarget(null);
        fetchUsers();
      } else {
        setSaveMsg(d.error ?? 'Failed.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────

  if (myRole === null && !forbidden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (forbidden || (myRole !== null && myRole !== 'admin')) {
    return (
      <div className="max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-red-800 mb-1">Access Denied</p>
          <p className="text-sm text-red-700">
            The Admin Panel requires Administrator role. Contact your system administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // ── Admin UI ───────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          Administration · Security
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Admin Panel
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Audit logs, user roles, and access management.
        </p>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['admin', 'analyst', 'viewer'] as Role[]).map(r => (
          <div key={r} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={labelClass(ROLE_COLORS[r])}>{r.toUpperCase()}</span>
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-2">{ROLE_LABELS[r]}</p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[r].map(p => (
                <li key={p} className="text-xs text-[#64748B] flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {(['audit', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors rounded-t-lg -mb-px border-b-2 ${
              tab === t
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t === 'audit' ? '📋 Audit Log' : '👥 User Roles'}
          </button>
        ))}
      </div>

      {/* ── AUDIT LOG TAB ─────────────────────────────────── */}
      {tab === 'audit' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">

          {/* Filters */}
          <div className="flex items-center gap-2 p-4 border-b border-[#F1F5F9]">
            <span className="text-xs font-semibold text-[#64748B] mr-1">Filter:</span>
            {['', 'oracle', 'sentinel', 'actor'].map(mod => (
              <button
                key={mod || 'all'}
                onClick={() => handleModuleFilter(mod)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  logsModule === mod
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
              >
                {mod ? MODULE_LABELS[mod] : 'ALL'}
              </button>
            ))}
            <span className="ml-auto text-xs text-[#94A3B8]">
              {logsTotal.toLocaleString()} total records
            </span>
          </div>

          {/* Table */}
          {logsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#94A3B8]">
              No audit logs found.{' '}
              {!logsModule && 'Run a query in any module to generate entries.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    {['Timestamp', 'User', 'Module', 'Action', 'Summary'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-[#64748B] tracking-wide uppercase px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={`border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B] whitespace-nowrap">
                        {fmtDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-xs text-[#0F172A] truncate">
                          {log.user_email ?? '—'}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8] truncate">
                          {log.user_id ?? 'dev-mode'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={labelClass(MODULE_COLORS[log.module] ?? '')}>
                          {MODULE_LABELS[log.module] ?? log.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B] uppercase font-semibold tracking-wide">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B] max-w-xs">
                        <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {JSON.stringify(log.input_summary, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {logsTotal > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
              <button
                onClick={() => handlePage('prev')}
                disabled={logsOffset === 0}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-[#94A3B8]">
                {logsOffset + 1}–{Math.min(logsOffset + LIMIT, logsTotal)} of {logsTotal.toLocaleString()}
              </span>
              <button
                onClick={() => handlePage('next')}
                disabled={logsOffset + LIMIT >= logsTotal}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A]">User Role Management</h2>
            <span className="text-xs text-[#94A3B8]">{users.length} users</span>
          </div>

          {saveMsg && (
            <div className={`mx-4 mt-3 px-4 py-2 rounded-lg text-xs font-semibold ${
              saveMsg === 'Role updated.'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMsg}
            </div>
          )}

          {usersLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#94A3B8]">
              <p>No users found in user_roles table.</p>
              <p className="text-xs mt-1">New users are auto-enrolled as analyst when they first sign in.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {['User ID', 'Current Role', 'Assigned', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#64748B] tracking-wide uppercase px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.user_id}
                    className={`border-b border-[#F8FAFC] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                      {u.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <span className={labelClass(ROLE_COLORS[u.role as Role] ?? '')}>
                        {(u.role ?? '').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">
                      {fmtDate(u.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      {editTarget === u.user_id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as Role)}
                            className="text-xs border border-[#D1D5DB] rounded px-2 py-1 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          >
                            <option value="admin">admin</option>
                            <option value="analyst">analyst</option>
                            <option value="viewer">viewer</option>
                          </select>
                          <button
                            onClick={handleSaveRole}
                            disabled={saving}
                            className="text-xs font-semibold px-3 py-1 rounded bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
                          >
                            {saving ? '…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditTarget(null)}
                            className="text-xs text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditTarget(u.user_id); setEditRole(u.role as Role); setSaveMsg(''); }}
                          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                        >
                          Change role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC] rounded-b-xl">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              <strong className="text-[#64748B]">Note:</strong>{' '}
              New users automatically receive the <span className="font-mono font-semibold">analyst</span> role when they sign up.
              To promote yourself to admin, run the SQL in <span className="font-mono">supabase/setup.sql</span> via the Supabase Dashboard → SQL Editor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
