import { useMembers, MemberWithRoles } from '@/hooks/useMembers';
import { mockMembers, getMembersByHierarchy } from '@/lib/mockData';
import MemberGrid from '@/components/MemberGrid';
import PageTransition from '@/components/PageTransition';

const Index = () => {
  const { data: dbMembers, isLoading } = useMembers();

  // Fall back to mock data if database is empty
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
            <span className="text-muted-foreground text-2xl mb-6 block opacity-40">🍁</span>
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
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : members && members.length > 0 ? (
            <MemberGrid members={members} />
          ) : null}
        </main>
      </div>
    </PageTransition>
  );
};

export default Index;
