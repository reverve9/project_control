-- Migration 006: 로드맵 테이블 단순화 (3테이블 → 1테이블)
-- 실행: Supabase Dashboard > SQL Editor

DROP TABLE IF EXISTS roadmap_cells;
DROP TABLE IF EXISTS roadmap_rows;
DROP TABLE IF EXISTS roadmap_groups;
DROP TABLE IF EXISTS roadmap_categories;

-- 행 (대분류 + 소분류 + 담당자 + 산출물)
CREATE TABLE roadmap_rows (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  major      text        NOT NULL,
  minor      text,
  assignee   text,
  output     text,
  sort_order integer              DEFAULT 0,
  user_id    uuid,
  created_at timestamptz          DEFAULT now()
);

ALTER TABLE roadmap_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roadmap rows" ON roadmap_rows
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
