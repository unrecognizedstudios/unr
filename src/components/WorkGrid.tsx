import { useState } from 'react';
import { motion } from 'framer-motion';
import { MemberWork } from '@/lib/mockData';

interface WorkGridProps {
  works: MemberWork[];
}

const WorkGrid = ({ works }: WorkGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
      {works.slice(0, 6).map((work, i) => (
        <motion.div
          key={work.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="aspect-[4/3] overflow-hidden"
        >
          {work.type === 'video' ? (
            <VideoItem work={work} />
          ) : (
            <ImageItem work={work} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

const ImageItem = ({ work }: { work: MemberWork }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      <img
        src={work.src}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${
          loaded ? 'blur-0 scale-100' : 'blur-md scale-105'
        }`}
        loading="lazy"
      />
    </div>
  );
};

const VideoItem = ({ work }: { work: MemberWork }) => {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        src={work.src}
        controls
        className="w-full h-full object-cover"
        autoPlay={false}
        onEnded={() => setPlaying(false)}
      />
    );
  }

  return (
    <div
      className="relative w-full h-full cursor-pointer group"
      onClick={() => setPlaying(true)}
    >
      <img
        src={work.thumbnail || work.src}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-background/30 group-hover:bg-background/50 transition-colors">
        <div className="w-12 h-12 rounded-full border-2 border-foreground flex items-center justify-center">
          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-foreground ml-1" />
        </div>
      </div>
    </div>
  );
};

export default WorkGrid;
