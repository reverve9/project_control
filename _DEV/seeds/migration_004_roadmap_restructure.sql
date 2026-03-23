-- Migration 004: 로드맵 테이블 재구성 (카테고리 > 대분류 > 소분류 > 월)
-- 실행: Supabase Dashboard > SQL Editor

-- 기존 테이블 삭제
DROP TABLE IF EXISTS roadmap_cells;
DROP TABLE IF EXISTS roadmap_rows;

-- 카테고리 (최종산출물 포함)
CREATE TABLE roadmap_categories (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid,
  label      text        NOT NULL,
  output     text,
  sort_order integer              DEFAULT 0,
  created_at timestamptz          DEFAULT now()
);

ALTER TABLE roadmap_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roadmap categories" ON roadmap_categories
  FOR ALL USING (auth.uid() = user_id);

-- 대분류
CREATE TABLE roadmap_groups (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid        NOT NULL REFERENCES roadmap_categories(id) ON DELETE CASCADE,
  user_id     uuid,
  label       text        NOT NULL,
  sort_order  integer              DEFAULT 0,
  created_at  timestamptz          DEFAULT now()
);

ALTER TABLE roadmap_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roadmap groups" ON roadmap_groups
  FOR ALL USING (auth.uid() = user_id);

-- 소분류
CREATE TABLE roadmap_rows (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   uuid        NOT NULL REFERENCES roadmap_groups(id) ON DELETE CASCADE,
  user_id    uuid,
  label      text        NOT NULL,
  sort_order integer              DEFAULT 0,
  created_at timestamptz          DEFAULT now()
);

ALTER TABLE roadmap_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roadmap rows" ON roadmap_rows
  FOR ALL USING (auth.uid() = user_id);

-- 셀 (월별 내용)
CREATE TABLE roadmap_cells (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id     uuid        NOT NULL REFERENCES roadmap_rows(id) ON DELETE CASCADE,
  year       integer     NOT NULL,
  month      integer     NOT NULL,
  content    text        NOT NULL DEFAULT '',
  user_id    uuid,
  created_at timestamptz          DEFAULT now()
);

ALTER TABLE roadmap_cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roadmap cells" ON roadmap_cells
  FOR ALL USING (auth.uid() = user_id);
