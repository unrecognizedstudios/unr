import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MemberWithRoles } from '@/hooks/useMembers';

interface MemberGridProps {
  members: MemberWithRoles[];
}

const MemberCard = ({ member, index }: { member: MemberWithRoles; index: number }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Link to={`/member/${member.slug}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="group relative aspect-[3/4] overflow-hidden cursor-pointer"
      >
        {/* Skeleton shown until image loads */}
        {!loaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {member.portrait_url ? (
          <img
            src={member.portrait_url}
            alt={member.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:opacity-60 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 transition-opacity duration-500 group-hover:opacity-60">
          <p className="font-heading text-foreground text-sm md:text-base tracking-widest">
            {member.name}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

const MemberGrid = ({ members }: MemberGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4">
      {members.map((member, i) => (
        <MemberCard key={member.id} member={member} index={i} />
      ))}
    </div>
  );
};

export default MemberGrid;
