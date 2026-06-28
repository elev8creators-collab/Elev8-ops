-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  initials TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_team_members" ON team_members
  FOR ALL TO anon
  USING (true) WITH CHECK (true);

INSERT INTO team_members (name, role, initials, pin, sort_order) VALUES
  ('Abhijot', 'editor',     'AB', '1234', 1),
  ('Narsi',   'editor',     'NA', '1234', 2),
  ('Harleen', 'editor',     'HA', '1234', 3),
  ('Vansh',   'editor',     'VB', '1234', 4),
  ('Narpat',  'production', 'NP', '1234', 5),
  ('SMM',     'social',     'SM', '1234', 6);
