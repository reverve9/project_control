-- Migration 001: name 컬럼 추가, 초대코드 1회용 처리
-- 실행: Supabase Dashboard > SQL Editor

-- 1. user_profiles에 name 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name text;
