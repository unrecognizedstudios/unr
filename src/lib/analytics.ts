import { supabase } from '@/integrations/supabase/client';

export async function trackEvent(memberId: string, eventType: 'page_view' | 'link_click', metadata?: Record<string, string>) {
  await supabase.from('analytics_events').insert({
    member_id: memberId,
    event_type: eventType,
    metadata: metadata || {},
  });
}
