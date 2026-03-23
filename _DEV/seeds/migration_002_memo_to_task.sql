-- Migration 002: 메모 → 태스크 전환
-- 실행: Supabase Dashboard > SQL Editor

-- 1. memos 테이블 → tasks로 이름 변경
ALTER TABLE memos RENAME TO tasks;

-- 2. memo_details 테이블 → task_items로 이름 변경
ALTER TABLE memo_details RENAME TO task_items;

-- 3. task_items의 memo_id → task_id로 컬럼명 변경
ALTER TABLE task_items RENAME COLUMN memo_id TO task_id;

-- 4. tasks에 assignee 컬럼 추가
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee varchar;

-- 5. RLS 정책 이름 업데이트 (기존 삭제 후 재생성)
DROP POLICY IF EXISTS "Users can access own memos" ON tasks;
CREATE POLICY "Users can access own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own details" ON task_items;
CREATE POLICY "Users can access own task items" ON task_items
  FOR ALL USING (auth.uid() = user_id);
