-- Migration 005: 로드맵을 프로젝트에 귀속
-- 실행: Supabase Dashboard > SQL Editor

ALTER TABLE roadmap_categories ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
