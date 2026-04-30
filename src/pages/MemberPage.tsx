import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Instagram, Globe } from 'lucide-react';
import { useMember, useMemberWorks } from '@/hooks/useMembers';
import { mockMembers } from '@/lib/mockData';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import WorkGrid from '@/components/WorkGrid';
import PageTransition from '@/components/PageTransition';
import { useEffect, useState } from 'react';
import Lightbox from '@/components/Lightbox';
import { useSEO } from '@/hooks/useSEO';

// ============================================
// Instagram Embed Component — uses official /embed/ iframe
// ============================================
const InstagramEmbed = ({ url }: { url: string }) => {
  const embedUrl = (() => {
    try {
      const u = new URL(url);
      const clean = u.pathname.replace(/\/$/, '');
      return `https://www.instagram.com${clean}/embed/`;
    } catch {
      return null;
    }
  })();

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline text-sm"
      >
        View on Instagram
      </a>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <iframe
        src={embedUrl}
        className="rounded-lg border border-border"
        style={{
          width: '100%',
          maxWidth: '540px',
          minHeight: '600px',
          border: 'none',
        }}
        scrolling="no"
        allowTransparency={true}
        allow="encrypted-media"
        title="Instagram post"
      />
    </div>
  );
};

// ============================================
// Helper — build an optimised Supabase Storage URL
// ============================================
function getOptimisedUrl(
  path: string,
  width: number,
  height?: number,
  quality = 75
): string {
  const { data } = supabase.storage.from('media').getPublicUrl(path, {
    transform: {
      width,
      ...(height ? { height } : {}),
      resize: 'cover',
      format: 'origin', // serves WebP to browsers that support it automatically
      quality,
    },
  });
  return data.publicUrl;
}

function getFullUrl(path: string): string {
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

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

  // Dynamic SEO for each member's page
  useSEO({
    title: member?.name,
    description: member?.bio
      ? member.bio.slice(0, 155)
      : member?.name
      ? `${member.name} — ${member?.roles?.join(', ')} at UnRecognized Studios.`
      : undefined,
    image: member?.portrait_url || undefined,
    url: slug ? `/member/${slug}` : undefined,
    type: 'profile',
  });

  const mockWorks = useMock
    ? mockMember!.works.map((w) => ({
        id: w.id,
        type: w.type,
        src: w.src,
        fullSrc: w.src,
        thumbnail: w.thumbnail,
      }))
    : [];

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

  // ============================================
  // Build work items — optimised thumbnails + full-res lightbox URLs
  // ============================================
  const works = useMock
    ? mockWorks
    : (worksRaw || []).map((w) => {
        // Instagram posts — no image processing needed
        if (w.type === 'instagram' || w.instagram_url) {
          return {
            id: w.id,
            type: 'instagram' as const,
            instagram_url: w.instagram_url,
          };
        }

        // Regular uploaded file — serve a small optimised thumbnail for the grid
        // and keep the original URL for the lightbox
        const src = getOptimisedUrl(w.storage_path!, 600, 600, 75);
        const fullSrc = getFullUrl(w.storage_path!);
        const thumbnail = w.thumbnail_path
          ? getOptimisedUrl(w.thumbnail_path, 600, 600, 75)
          : undefined;

        return {
          id: w.id,
          type: w.type as 'image' | 'video',
          src,
          fullSrc,
          thumbnail,
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
          <div
            className="relative w-full aspect-[3/4] max-h-[70vh] overflow-hidden cursor-zoom-in"
            onClick={() => setLightboxSrc(member.portrait_url!)}
          >
            {/* Skeleton shown until portrait loads */}
            <div className="absolute inset-0 bg-muted animate-pulse" />
            <img
              src={member.portrait_url}
              alt={member.name}
              fetchPriority="high"
              decoding="async"
              className="relative w-full h-full object-cover transition-opacity duration-500 opacity-0 [&[data-loaded]]:opacity-100"
              onLoad={(e) => (e.currentTarget.dataset.loaded = 'true')}
            />
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

            {works.some((w: any) => w.type === 'instagram') ? (
              // Mixed grid — includes Instagram embeds
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {works.map((work: any) => (
                  <div key={work.id}>
                    {work.type === 'instagram' && work.instagram_url ? (
                      <InstagramEmbed url={work.instagram_url} />
                    ) : (
                      <div className="aspect-square overflow-hidden rounded-lg">
                        {work.type === 'video' ? (
                          <video
                            src={work.src}
                            controls
                            className="w-full h-full object-cover"
                            preload="none"        // don't download video bytes until user taps play
                          />
                        ) : (
                          <img
                            src={work.src}
                            alt="Portfolio item"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            onClick={() => setLightboxSrc(work.fullSrc || work.src)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Pure image/video grid — use WorkGrid
              <WorkGrid
                works={works.filter((w: any) => w.type !== 'instagram')}
                onOpen={(fullSrc) => setLightboxSrc(fullSrc)}
              />
            )}
          </div>
        )}
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </PageTransition>
  );
};

export default MemberPage;
