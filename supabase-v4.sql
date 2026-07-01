-- Run this in your Supabase SQL editor to upgrade to V4 schema

-- Add total_videos column if it doesn't exist
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS total_videos INTEGER DEFAULT 0;

-- Add timezone column if it doesn't exist  
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';

-- Update existing rows to calculate total_videos from tasks
UPDATE daily_logs 
SET total_videos = (
  SELECT COALESCE(SUM((task->>'videos')::numeric), 0)
  FROM jsonb_array_elements(tasks::jsonb) AS task
  WHERE task->>'videos' IS NOT NULL
)
WHERE total_videos = 0 AND tasks IS NOT NULL;

-- Make sure RLS is enabled and policy allows inserts
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON daily_logs;
CREATE POLICY "Allow all operations" ON daily_logs
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'V4 schema migration complete!' as status;
