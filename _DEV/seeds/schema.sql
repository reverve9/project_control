-- Project Control DB Schema
-- Supabase project: cahhwowhftbvwzhflyjc (Seoul)
-- Exported: 2026-03-23

-- ============================================
-- invite_codes
-- ============================================
CREATE TABLE invite_codes (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code       text        NOT NULL,
  created_by uuid,
  active     boolean              DEFAULT true,
  created_at timestamptz          DEFAULT now()
);

-- ============================================
-- project_categories
-- ============================================
CREATE TABLE project_categories (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid,
  name       text        NOT NULL,
  sort_order integer              DEFAULT 0,
  created_at timestamptz          DEFAULT now()
);

-- ============================================
-- projects
-- ============================================
CREATE TABLE projects (
  id          uuid             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        varchar          NOT NULL,
  description text,
  color       varchar          NOT NULL DEFAULT '#2c3e50',
  created_at  timestamptz               DEFAULT now(),
  updated_at  timestamptz               DEFAULT now(),
  user_id     uuid,
  archived    boolean                   DEFAULT false,
  category_id uuid             REFERENCES project_categories(id) ON DELETE SET NULL,
  sort_order  integer                   DEFAULT 0
);

-- ============================================
-- memos
-- ============================================
CREATE TABLE memos (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      varchar     NOT NULL,
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now(),
  user_id    uuid,
  started_at timestamp            DEFAULT now(),  -- NOTE: without time zone
  archived   boolean              DEFAULT false,
  priority   integer              DEFAULT 1
);

-- ============================================
-- memo_details
-- ============================================
CREATE TABLE memo_details (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memo_id      uuid        NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  completed    boolean              DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz          DEFAULT now(),
  user_id      uuid
);

-- ============================================
-- project_infos
-- ============================================
CREATE TABLE project_infos (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type       varchar     NOT NULL,
  label      varchar     NOT NULL,
  value      text        NOT NULL,
  created_at timestamptz          DEFAULT now(),
  user_id    uuid
);

-- ============================================
-- user_profiles
-- ============================================
CREATE TABLE user_profiles (
  id          uuid        NOT NULL PRIMARY KEY,  -- references auth.users(id)
  email       text,
  name        text,
  role        text                 DEFAULT 'user',
  approved    boolean              DEFAULT false,
  invite_code text,
  created_at  timestamptz          DEFAULT now()
);

-- ============================================
-- style_guide
-- ============================================
CREATE TABLE style_guide (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content    text        NOT NULL,
  updated_at timestamptz          DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================
-- All tables have RLS enabled

-- projects: 본인 데이터만 CRUD
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- memos: 본인 데이터만 CRUD
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own memos" ON memos
  FOR ALL USING (auth.uid() = user_id);

-- memo_details: 본인 데이터만 CRUD
ALTER TABLE memo_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own details" ON memo_details
  FOR ALL USING (auth.uid() = user_id);

-- project_infos: 본인 데이터만 CRUD
ALTER TABLE project_infos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own infos" ON project_infos
  FOR ALL USING (auth.uid() = user_id);

-- project_categories: 본인 카테고리만 CRUD
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own categories" ON project_categories
  FOR ALL USING (auth.uid() = user_id);

-- user_profiles: 누구나 조회, 본인만 INSERT/UPDATE, 관리자는 전체 UPDATE/DELETE
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can select profiles" ON user_profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- invite_codes: 누구나 조회, 관리자만 관리
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read invite codes" ON invite_codes
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage invite codes" ON invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- style_guide: 로그인 유저 조회, 관리자만 수정
ALTER TABLE style_guide ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read style guide" ON style_guide
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update style guide" ON style_guide
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
