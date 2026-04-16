import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Fix for chunk size warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Split Radix UI components into chunks
          'radix-dialogs': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-context-menu',
          ],
          'radix-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
          ],
          'radix-misc': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-aspect-ratio',
          ],
          
          // Animation libraries
          'animation': ['framer-motion', 'embla-carousel-react'],
          
          // Form utilities
          'form-utils': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Data/Query management
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          
          // UI utilities
          'ui-utils': [
            'clsx', 
            'tailwind-merge', 
            'class-variance-authority',
            'lucide-react',
          ],
          
          // Charts and visualizations
          'charts': ['recharts'],
          
          // Miscellaneous
          'misc': [
            'cmdk',
            'date-fns',
            'input-otp',
            'next-themes',
            'react-day-picker',
            'react-resizable-panels',
            'sonner',
            'vaul',
          ],
        },
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
}));
