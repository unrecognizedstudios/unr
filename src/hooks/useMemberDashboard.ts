// src/hooks/useMemberDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to consolidate all member dashboard queries
 * This reduces code duplication and makes the MemberDashboard cleaner
 */
export const useMemberDashboard = (memberId: string | null) => {
  // Fetch member data
  const memberQuery = useQuery({
    queryKey: ['dashboard-member', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch available roles
  const availableRolesQuery = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('available_roles')
        .select('*');
      return data || [];
    },
  });

  // Fetch member's current roles
  const memberRolesQuery = useQuery({
    queryKey: ['member-roles', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from('member_roles')
        .select('role_id')
        .eq('member_id', memberId);
      return data?.map((r) => r.role_id) || [];
    },
    enabled: !!memberId,
  });

  // Fetch pending changes
  const pendingChangesQuery = useQuery({
    queryKey: ['pending-changes', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from('pending_changes')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!memberId,
  });

  // Fetch member works
  const worksQuery = useQuery({
    queryKey: ['member-works-dashboard', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from('member_works')
        .select('*')
        .eq('member_id', memberId)
        .order('display_order');
      return data || [];
    },
    enabled: !!memberId,
  });

  // Analytics
  const analyticsQuery = useQuery({
    queryKey: ['member-analytics', memberId],
    queryFn: async () => {
      if (!memberId) return { views: 0, clicks: 0 };
      const [views, clicks] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('event_type', 'page_view'),
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('event_type', 'link_click'),
      ]);
      return { views: views.count || 0, clicks: clicks.count || 0 };
    },
    enabled: !!memberId,
  });

  return {
    member: memberQuery.data,
    availableRoles: availableRolesQuery.data,
    memberRoles: memberRolesQuery.data,
    pendingChanges: pendingChangesQuery.data,
    works: worksQuery.data,
    analytics: analyticsQuery.data,
    isLoading: memberQuery.isLoading,
  };
};
