-- ============================================================
-- KAIROS Intelligence Platform — Database Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── 1. Audit Logs ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    TEXT,
  module        TEXT        NOT NULL CHECK (module IN ('oracle', 'sentinel', 'actor', 'watchlist', 'documents')),
  action        TEXT        NOT NULL DEFAULT 'query'
                            CHECK (action IN ('query', 'login', 'logout', 'export')),
  input_summary JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast admin queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module      ON audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs (created_at DESC);

-- Row-level security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may INSERT their own log entries
CREATE POLICY "Users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can SELECT audit logs (enforced via service role in API)
-- Regular reads go through the /api/admin/audit-logs endpoint which checks role
CREATE POLICY "Admins can select audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 2. User Roles ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role        TEXT        NOT NULL DEFAULT 'analyst'
                          CHECK (role IN ('admin', 'analyst', 'viewer')),
  assigned_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert/update roles
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 3. Auto-assign analyst role on signup ──────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'analyst')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 4. Promote first admin ─────────────────────────────────
-- After running this script, make yourself admin by running:
--
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('<your-user-uuid>', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--
-- Find your UUID: SELECT id, email FROM auth.users;
-- ─────────────────────────────────────────────────────────────
