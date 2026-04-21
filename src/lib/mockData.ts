export type MemberRole = 'Photographer' | 'Videographer' | 'Editor' | 'Director' | 'Creative';
export type MemberTitle = 'Founder' | 'Partner' | 'Member';

export interface MemberWork {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
}

export interface Member {
  id: string;
  name: string;
  slug: string;
  title: MemberTitle;
  roles: MemberRole[];
  bio: string;
  portrait: string;
  works: MemberWork[];
  links: {
    instagram?: string;
    website?: string;
  };
  order: number;
}

export const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Marcus Reid',
    slug: 'marcus-reid',
    title: 'Founder',
    roles: ['Photographer', 'Director'],
    bio: 'Visual storyteller rooted in the streets. Capturing raw emotion through analog and digital mediums.',
    portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w1', type: 'image', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' },
      { id: 'w2', type: 'image', src: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=800&h=600&fit=crop' },
      { id: 'w3', type: 'image', src: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&h=600&fit=crop' },
      { id: 'w4', type: 'image', src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop' },
      { id: 'w5', type: 'image', src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop' },
      { id: 'w6', type: 'image', src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com', website: 'https://example.com' },
    order: 1,
  },
  {
    id: '2',
    name: 'Aisha Patel',
    slug: 'aisha-patel',
    title: 'Founder',
    roles: ['Videographer', 'Editor'],
    bio: 'Motion-first creative. Turning fleeting moments into lasting cinema.',
    portrait: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w7', type: 'image', src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop' },
      { id: 'w8', type: 'image', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' },
      { id: 'w9', type: 'image', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com' },
    order: 2,
  },
  {
    id: '3',
    name: 'Deon Carter',
    slug: 'deon-carter',
    title: 'Partner',
    roles: ['Photographer', 'Creative'],
    bio: 'Light chaser. Finding beauty in the overlooked corners of the city.',
    portrait: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w10', type: 'image', src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop' },
      { id: 'w11', type: 'image', src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop' },
      { id: 'w12', type: 'image', src: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=600&fit=crop' },
      { id: 'w13', type: 'image', src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com', website: 'https://example.com' },
    order: 3,
  },
  {
    id: '4',
    name: 'Yuki Tanaka',
    slug: 'yuki-tanaka',
    title: 'Member',
    roles: ['Videographer', 'Director'],
    bio: 'Cinematic vision meets street culture. Every frame tells a story.',
    portrait: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w14', type: 'image', src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop' },
      { id: 'w15', type: 'image', src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com' },
    order: 4,
  },
  {
    id: '5',
    name: 'Elena Voss',
    slug: 'elena-voss',
    title: 'Member',
    roles: ['Photographer', 'Editor'],
    bio: 'Documentary approach to creative portraiture. Raw, unfiltered, real.',
    portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w16', type: 'image', src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop' },
      { id: 'w17', type: 'image', src: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop' },
      { id: 'w18', type: 'image', src: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=600&fit=crop' },
      { id: 'w19', type: 'image', src: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&h=600&fit=crop' },
      { id: 'w20', type: 'image', src: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=800&h=600&fit=crop' },
      { id: 'w21', type: 'image', src: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com', website: 'https://example.com' },
    order: 5,
  },
  {
    id: '6',
    name: 'Jordan Blake',
    slug: 'jordan-blake',
    title: 'Member',
    roles: ['Creative', 'Photographer'],
    bio: 'Blending fine art sensibility with street-level authenticity.',
    portrait: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop&crop=face',
    works: [
      { id: 'w22', type: 'image', src: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop' },
      { id: 'w23', type: 'image', src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop' },
      { id: 'w24', type: 'image', src: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=600&fit=crop' },
    ],
    links: { instagram: 'https://instagram.com' },
    order: 6,
  },
];

export function getMembersByHierarchy(members: Member[]): Member[] {
  const order: Record<MemberTitle, number> = { Founder: 0, Partner: 1, Member: 2 };
  return [...members].sort((a, b) => {
    const titleDiff = order[a.title] - order[b.title];
    if (titleDiff !== 0) return titleDiff;
    return a.order - b.order;
  });
}
