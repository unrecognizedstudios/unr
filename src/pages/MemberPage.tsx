import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Instagram, Globe } from 'lucide-react';
import { useMember, useMemberWorks } from '@/hooks/useMembers';
import { mockMembers } from '@/lib/mockData';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import WorkGrid from '@/components/WorkGrid';
import PageTransition from '@/components/PageTransition';
import { useEffect } from 'react';

const MemberPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dbMember, isLoading } = useMember(slug || '');
  const { data: worksRaw } = useMemberWorks(dbMember?.id || '');

  // Mock fallback
  const mockMember = mockMembers.find((m) => m.slug === slug);
  const useMock = !isLoading && !dbMember && !!mockMember;

  const member = useMock
    ? {
        id: mockMember!.id,
        name: mockMember!.name,
        slug: mockMember!.slug,
        title: mockMember!.title,
        bio: mockMember!.bio,
        portrait_url: mockMember!.portrait,
        instagram_url: mockMember!.links.instagram || '',
        website_url: mockMember!.links.website || '',
        roles: mockMember!.roles,
      }
    : dbMember;

  const mockWorks = useMock
    ? mockMember!.works.map((w) => ({ id: w.id, type: w.type, src: w.src, thumbnail: w.thumbnail }))
    : [];

  // Track page view
  useEffect(() => {
    if (dbMember?.id) {
      trackEvent(dbMember.id, 'page_view');
    }
  }, [dbMember?.id]);

  if (isLoading) return <div className="min-h-screen bg-background" />;

  if (!member) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Member not found.</p>
        </div>
      </PageTransition>
    );
  }

  const rolesDisplay = member.roles.join(' / ');

  // Build work items with public URLs
  const works = useMock
    ? mockWorks
    : (worksRaw || []).map((w) => {
        const { data } = supabase.storage.from('media').getPublicUrl(w.storage_path);
        return {
          id: w.id,
          type: w.type as 'image' | 'video',
          src: data.publicUrl,
          thumbnail: w.thumbnail_path
            ? supabase.storage.from('media').getPublicUrl(w.thumbnail_path).data.publicUrl
            : undefined,
        };
      });

  const handleLinkClick = (linkType: string) => {
    if (dbMember?.id) {
      trackEvent(dbMember.id, 'link_click', { link_type: linkType });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 left-4 z-50">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Portrait Header */}
        {member.portrait_url ? (
          <div className="relative w-full aspect-[3/4] max-h-[70vh] overflow-hidden">
            <img src={member.portrait_url} alt={member.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <h1 className="font-heading text-foreground text-4xl md:text-6xl tracking-wider">{member.name}</h1>
              {rolesDisplay && (
                <p className="text-primary text-sm md:text-base tracking-wide mt-1 uppercase">{rolesDisplay}</p>
              )}
              <p className="text-muted-foreground text-xs tracking-widest mt-1 uppercase">{member.title}</p>
            </div>
          </div>
        ) : (
          <div className="pt-20 px-6 md:px-10">
            <h1 className="font-heading text-foreground text-4xl md:text-6xl tracking-wider">{member.name}</h1>
            {rolesDisplay && (
              <p className="text-primary text-sm md:text-base tracking-wide mt-1 uppercase">{rolesDisplay}</p>
            )}
            <p className="text-muted-foreground text-xs tracking-widest mt-1 uppercase">{member.title}</p>
          </div>
        )}

        {/* Bio */}
        {member.bio && (
          <div className="px-6 md:px-10 py-8 max-w-2xl">
            <p className="text-secondary-foreground text-sm md:text-base leading-relaxed">{member.bio}</p>
          </div>
        )}

        {/* Links */}
        {(member.instagram_url || member.website_url) && (
          <div className="px-6 md:px-10 pb-4 flex gap-6">
            {member.instagram_url && (
              <a
                href={member.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick('instagram')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram size={20} />
              </a>
            )}
            {member.website_url && (
              <a
                href={member.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick('website')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe size={20} />
              </a>
            )}
          </div>
        )}

        {/* Portfolio */}
        {works.length > 0 && (
          <div className="px-6 md:px-10 pb-16">
            <p className="text-muted-foreground text-xs tracking-widest uppercase mb-4">Portfolio</p>
            <WorkGrid works={works} />
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MemberPage;
