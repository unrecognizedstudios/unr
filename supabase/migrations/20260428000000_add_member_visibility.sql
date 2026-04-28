-- Add is_hidden column to members table
-- When true, the member is not shown on the public main page
-- but their account and data are fully preserved

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN members.is_hidden IS
  'When true the member is hidden from the public main page. Set by admins to stage new accounts before publishing.';
