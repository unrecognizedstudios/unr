import { useState } from 'react';
import { motion } from 'framer-motion';
import { MemberWork } from '@/lib/mockData';
import Lightbox from '@/components/Lightbox';

interface WorkItem extends MemberWork {
  /** Full-resolution URL used by the lightbox (grid shows the compressed `src`) */
  fullSrc?: string;
}

interface WorkGridProps {
  works: WorkItem[];
  /**
   * Optional: called with the full-res URL when the user opens an image.
   * If provided, the parent controls the lightbox (used by MemberPage).
   * If omitted, WorkGrid manages its own internal lightbox.
   */
  onOpen?: (fullSrc: string) => void;
}

const WorkGrid = ({ works, onOpen }: WorkGridProps) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleOpen = (work: WorkItem) => {
    const url = work.fullSrc || work.src;
    if (onOpen) {
      onOpen(url);
    } else {
      setLightboxSrc(url);
    }
  };

  return (
    <>
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
              <ImageItem work={work} onOpen={() => handleOpen(work)} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Internal lightbox — only used when no onOpen prop is passed */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
};

const ImageItem = ({ work, onOpen }: { work: WorkItem; onOpen: () => void }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full cursor-zoom-in" onClick={onOpen}>
      {/* Skeleton pulse behind the image */}
      <div className="absolute inset-0 bg-muted animate-pulse" />
      <img
        src={work.src}          // optimised thumbnail URL (600×600, WebP)
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`relative w-full h-full object-cover transition-all duration-700 ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
        }`}
      />
    </div>
  );
};

const VideoItem = ({ work }: { work: WorkItem }) => {
  const [playing, setPlaying] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);

  if (playing) {
    return (
      <video
        src={work.src}
        controls
        autoPlay={false}
        className="w-full h-full object-cover"
        onEnded={() => setPlaying(false)}
      />
    );
  }

  return (
    <div className="relative w-full h-full cursor-pointer group" onClick={() => setPlaying(true)}>
      {/* Skeleton behind thumbnail */}
      {!thumbLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={work.thumbnail || work.src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setThumbLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          thumbLoaded ? 'opacity-100' : 'opacity-0'
        }`}
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
