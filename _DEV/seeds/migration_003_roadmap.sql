-- Migration 003: 업무 일람 (로드맵) 테이블 추가
-- 실행: Supabase Dashboard > SQL Editor

-- 행 (항목)
CREATE TABLE roadmap_rows (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
