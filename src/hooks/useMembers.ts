import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberWithRoles {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  title: 'Founder' | 'Partner' | 'Member';
  bio: string;
  portrait_url: string;
  instagram_url: string;
  website_url: string;
  display_order: number;
  editing_locked: boolean;
  is_hidden: boolean;
  roles: string[];
}

async function fetchMembers(): Promise<MemberWithRoles[]> {
  const { data: members, error } = await supabase
    .from('members')
    .select('*, member_roles(role_id, available_roles(name))')
    .order('display_order', { ascending: true });

  if (error) throw error;
  if (!members) return [];

  const titleOrder = { Founder: 0, Partner: 1, Member: 2 };

  return (members as any[])
    .map((m) => ({
      id: m.id,
      user_id: m.user_id,
      name: m.name,
      slug: m.slug,
      title: m.title,
      bio: m.bio || '',
      portrait_url: m.portrait_url || '',
      instagram_url: m.instagram_url || '',
      website_url: m.website_url || '',
      display_order: m.display_order,
      editing_locked: m.editing_locked,
      is_hidden: m.is_hidden ?? false,
      roles: m.member_roles?.map((mr: any) => mr.available_roles?.name).filter(Boolean) || [],
    }))
    .filter((m) => !m.is_hidden)
    .sort((a, b) => {
      const td = titleOrder[a.title] - titleOrder[b.title];
      return td !== 0 ? td : a.display_order - b.display_order;
    });
}

export function useMembers() {
  return useQuery({ queryKey: ['members'], queryFn: fetchMembers });
}

async function fetchMember(slug: string): Promise<MemberWithRoles | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*, member_roles(role_id, available_roles(name))')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const m = data as any;
  return {
    id: m.id,
    user_id: m.user_id,
    name: m.name,
    slug: m.slug,
    title: m.title,
    bio: m.bio || '',
    portrait_url: m.portrait_url || '',
    instagram_url: m.instagram_url || '',
    website_url: m.website_url || '',
    display_order: m.display_order,
    editing_locked: m.editing_locked,
    is_hidden: m.is_hidden ?? false,
    roles: m.member_roles?.map((mr: any) => mr.available_roles?.name).filter(Boolean) || [],
  };
}

export function useMember(slug: string) {
  return useQuery({ queryKey: ['member', slug], queryFn: () => fetchMember(slug), enabled: !!slug });
}

export function useMemberWorks(memberId: string) {
  return useQuery({
    queryKey: ['member-works', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_works')
        .select('*')
        .eq('member_id', memberId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!memberId,
  });
}
