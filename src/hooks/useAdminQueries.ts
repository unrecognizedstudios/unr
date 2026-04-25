import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminQueries = () => {
  // Track which tabs have been opened so we only fire queries when needed
  const [enabledQueries, setEnabledQueries] = useState({
    pending: true,   // always load — it's the default tab and shows the badge count
    members: true,   // always load — needed for the Posts tab filter too
    roles: false,
    analytics: false,
  });

  // Call this in AdminDashboard when the user clicks a tab
  const enableQuery = (key: keyof typeof enabledQueries) => {
    setEnabledQueries((prev) => ({ ...prev, [key]: true }));
  };

  const pendingQuery = useQuery({
    queryKey: ['admin-pending'],
    enabled: enabledQueries.pending,
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_changes')
        .select('*, members(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const membersQuery = useQuery({
    queryKey: ['admin-members'],
    enabled: enabledQueries.members,
    queryFn: async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('display_order');
      return data || [];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    enabled: enabledQueries.roles,
    queryFn: async () => {
      const { data } = await supabase
        .from('available_roles')
        .select('*')
        .order('name');
      return data || [];
    },
  });

  // Analytics is the heaviest query — two full table scans.
  // Only runs after the user actually opens the Analytics tab.
  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    enabled: enabledQueries.analytics,
    queryFn: async () => {
      const now = new Date();
      const date30 = new Date(now);
      date30.setDate(date30.getDate() - 30);
      const date365 = new Date(now);
      date365.setFullYear(date365.getFullYear() - 1);

      const [events30, events365] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('event_type, member_id, members(name)')
          .gte('created_at', date30.toISOString()),
        supabase
          .from('analytics_events')
          .select('event_type, member_id, members(name)')
          .gte('created_at', date365.toISOString()),
      ]);

      const buildStats = (events: any[]) => {
        const totalViews = events.filter(e => e.event_type === 'page_view').length;
        const totalClicks = events.filter(e => e.event_type === 'link_click').length;
        const perMember: Record<string, { name: string; views: number; clicks: number }> = {};
        events.forEach((e: any) => {
          if (!e.member_id) return;
          if (!perMember[e.member_id]) {
            perMember[e.member_id] = { name: e.members?.name || 'Unknown', views: 0, clicks: 0 };
          }
          if (e.event_type === 'page_view') perMember[e.member_id].views++;
          else perMember[e.member_id].clicks++;
        });
        return { totalViews, totalClicks, perMember };
      };

      return {
        last30: buildStats(events30.data || []),
        last365: buildStats(events365.data || []),
      };
    },
  });

  return {
    pending: pendingQuery.data,
    members: membersQuery.data,
    roles: rolesQuery.data,
    analytics: analyticsQuery.data,
    isLoading: pendingQuery.isLoading || membersQuery.isLoading,
    enableQuery,
  };
};
