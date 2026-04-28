import { useMembers, MemberWithRoles } from '@/hooks/useMembers';
import { mockMembers, getMembersByHierarchy } from '@/lib/mockData';
import MemberGrid from '@/components/MemberGrid';
import PageTransition from '@/components/PageTransition';
import { useSEO } from '@/hooks/useSEO';

// Skeleton grid that matches MemberGrid's layout exactly so there's no layout shift
const MemberGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
    ))}
  </div>
);

const Index = () => {
  useSEO({ url: '/' });
  const { data: dbMembers, isLoading } = useMembers();

  const useMock = !isLoading && (!dbMembers || dbMembers.length === 0);
  const mockConverted: MemberWithRoles[] = getMembersByHierarchy(mockMembers).map((m) => ({
    id: m.id,
    user_id: '',
    name: m.name,
    slug: m.slug,
    title: m.title,
    bio: m.bio,
    portrait_url: m.portrait,
    instagram_url: m.links.instagram || '',
    website_url: m.links.website || '',
    display_order: m.order,
    editing_locked: false,
    roles: m.roles,
  }));

  const members = useMock ? mockConverted : dbMembers;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex flex-col items-center justify-center min-h-[90vh] px-4">
          <div className="text-center">
            <h1 className="font-heading text-foreground text-[15vw] md:text-[12vw] lg:text-[10vw] leading-[0.85] tracking-wider">
              Unrecognized
            </h1>
            <h1 className="font-heading text-primary text-[15vw] md:text-[12vw] lg:text-[10vw] leading-[0.85] tracking-wider">
              Studios
            </h1>
          </div>
        </header>

        <main className="flex-1">
          {isLoading ? (
            <MemberGridSkeleton />
          ) : members && members.length > 0 ? (
            <MemberGrid members={members} />
          ) : null}
        </main>

        <footer className="mt-20 mb-12 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-full max-w-xs border-t border-border opacity-20" />
          <h2 className="font-heading text-foreground text-2xl tracking-widest uppercase">
            Contact Us
          </h2>
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm tracking-wide">
            <a href="mailto:unrecognized.s@hotmail.com" className="hover:text-foreground transition-colors duration-200">
              unrecognized.s@hotmail.com
            </a>
            <a href="https://www.instagram.com/unrecognizedstudio?igsh=bnZnOHQwdWltb3Rv" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;
