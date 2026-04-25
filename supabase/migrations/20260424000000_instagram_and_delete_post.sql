-- ============================================================
-- Migration: Instagram post support + admin delete post
-- ============================================================

-- 1. Make storage_path nullable so Instagram posts don't need one
ALTER TABLE public.member_works
  ALTER COLUMN storage_path DROP NOT NULL;

-- 2. Add instagram_url column
ALTER TABLE public.member_works
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 3. Relax the type CHECK to also allow 'instagram'
ALTER TABLE public.member_works
  DROP CONSTRAINT IF EXISTS member_works_type_check;

ALTER TABLE public.member_works
  ADD CONSTRAINT member_works_type_check
    CHECK (type IN ('image', 'video', 'instagram'));

-- 4. Enforce: every row must have EITHER storage_path OR instagram_url
ALTER TABLE public.member_works
  ADD CONSTRAINT member_works_has_source
    CHECK (
      (storage_path IS NOT NULL AND instagram_url IS NULL)
      OR
      (instagram_url IS NOT NULL AND storage_path IS NULL)
    );

-- 5. RLS: allow admins to delete any member_works row
--    (members can already delete their own via existing policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'member_works'
      AND policyname = 'Admins can delete any work'
  ) THEN
    CREATE POLICY "Admins can delete any work"
      ON public.member_works
      FOR DELETE
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 6. Add 'Co-Founder' to the member_title enum
ALTER TYPE public.member_title ADD VALUE IF NOT EXISTS 'Co-Founder' BEFORE 'Founder';
