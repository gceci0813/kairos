/**
 * RBAC type definitions and UI constants.
 * This file is safe to import from both client and server components.
 * Server-side logic (getUserRole, etc.) lives in lib/rbac.ts (server only).
 */

export type Role = 'admin' | 'analyst' | 'viewer';

/**
 * Role hierarchy:
 *   admin  — full access: generate analysis, view audit logs, manage user roles
 *   analyst — generate analysis, use all AI modules (default for new users)
 *   viewer  — read-only: browse reports but cannot trigger new AI analysis
 */

export const ROLE_LABELS: Record<Role, string> = {
  admin:   'Administrator',
  analyst: 'Intelligence Analyst',
  viewer:  'Read-Only Viewer',
};

export const ROLE_COLORS: Record<Role, string> = {
  admin:   'bg-red-50 text-red-700 border-red-200',
  analyst: 'bg-blue-50 text-blue-700 border-blue-200',
  viewer:  'bg-slate-50 text-slate-600 border-slate-200',
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'Generate AI analysis (ORACLE, SENTINEL, ACTOR)',
    'View full audit logs',
    'Manage user roles',
    'Access admin panel',
  ],
  analyst: [
    'Generate AI analysis (ORACLE, SENTINEL, ACTOR)',
    'View own activity',
  ],
  viewer: [
    'Browse existing reports',
    'View global signals map',
  ],
};
