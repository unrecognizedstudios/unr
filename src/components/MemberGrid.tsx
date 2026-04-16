import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MemberWithRoles } from '@/hooks/useMembers';

interface MemberGridProps {
  members: MemberWithRoles[];
}

const MemberGrid = ({ members }: MemberGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-4">
      {members.map((member, i) => (
        <Link key={member.id} to={`/member/${member.slug}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="group relative aspect-[3/4] overflow-hidden cursor-pointer"
          >
            {member.portrait_url ? (
              <img
                src={member.portrait_url}
                alt={member.name}
                className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-60"
                loading="lazy"
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
      ))}
    </div>
  );
};

export default MemberGrid;
