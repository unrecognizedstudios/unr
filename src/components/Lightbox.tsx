import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const Lightbox = ({ src, alt = '', onClose }: LightboxProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors p-2"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Image */}
        <motion.img
          src={src}
          alt={alt}
          className="relative z-10 max-w-[90vw] max-h-[90vh] object-contain"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()} // click on image itself doesn't close
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;
