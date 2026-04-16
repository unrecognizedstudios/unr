
-- Fix 1: Replace overly permissive analytics insert policy
DROP POLICY "Anyone can create analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (
    event_type IN ('page_view', 'link_click')
    AND member_id IS NOT NULL
  );

-- Fix 2: Replace broad storage SELECT with scoped policy
DROP POLICY "Public can view media" ON storage.objects;
CREATE POLICY "Public can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media' AND (storage.foldername(name))[1] IS NOT NULL);
