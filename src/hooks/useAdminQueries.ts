// src/hooks/useAdminQueries.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to consolidate all admin-related queries
 * This reduces code duplication and makes the AdminDashboard cleaner
 */
export const useAdminQueries = () => {
  // Pending changes
  const pendingQuery = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_changes')
        .select('*, members(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // All members
  const membersQuery = useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('display_order');
      return data || [];
    },
  });

  // Available roles
  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('available_roles')
        .select('*')
        .order('name');
      return data || [];
    },
  });

  // Analytics
  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, member_id, members(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      
      const totalViews = events?.filter(e => e.event_type === 'page_view').length || 0;
      const totalClicks = events?.filter(e => e.event_type === 'link_click').length || 0;
      
      // Per member breakdown
      const perMember: Record<string, { name: string; views: number; clicks: number }> = {};
      events?.forEach((e: any) => {
        if (!e.member_id) return;
        if (!perMember[e.member_id]) {
          perMember[e.member_id] = { name: e.members?.name || 'Unknown', views: 0, clicks: 0 };
        }
        if (e.event_type === 'page_view') perMember[e.member_id].views++;
        else perMember[e.member_id].clicks++;
      });

      return { totalViews, totalClicks, perMember };
    },
  });

  return {
    pending: pendingQuery.data,
    members: membersQuery.data,
    roles: rolesQuery.data,
    analytics: analyticsQuery.data,
    isLoading: pendingQuery.isLoading || membersQuery.isLoading || rolesQuery.isLoading || analyticsQuery.isLoading,
  };
};
