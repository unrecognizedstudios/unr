import { useEffect } from 'react';

const SITE_NAME = 'UnRecognized Studios';
const BASE_URL = 'https://www.unrecognizedstudios.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION =
  'A creative collective of photographers, directors, and visual artists pushing the boundaries of visual storytelling.';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile';
}

/**
 * useSEO — sets page-level <title> and meta tags dynamically.
 *
 * Usage:
 *   useSEO({ title: 'Jordan Lee', description: 'Photographer & Director', url: '/member/jordan-lee' });
 */
export function useSEO({ title, description, image, url, type = 'website' }: SEOProps = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Creative Collective`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set or create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr.split('=')[0], attr.split('=')[1]?.replace(/"/g, '') ?? attr);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    const setMetaName = (name: string, content: string) =>
      setMeta(`meta[name="${name}"]`, `name="${name}"`, content);

    const setMetaProp = (property: string, content: string) =>
      setMeta(`meta[property="${property}"]`, `property="${property}"`, content);

    // Standard
    setMetaName('description', metaDescription);
    setMetaName('robots', 'index, follow');

    // Canonical
    let canonical_el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical_el) {
      canonical_el = document.createElement('link');
      canonical_el.rel = 'canonical';
      document.head.appendChild(canonical_el);
    }
    canonical_el.href = canonical;

    // Open Graph
    setMetaProp('og:title', fullTitle);
    setMetaProp('og:description', metaDescription);
    setMetaProp('og:image', metaImage);
    setMetaProp('og:url', canonical);
    setMetaProp('og:type', type);
    setMetaProp('og:site_name', SITE_NAME);

    // Twitter
    setMetaName('twitter:title', fullTitle);
    setMetaName('twitter:description', metaDescription);
    setMetaName('twitter:image', metaImage);
  }, [fullTitle, metaDescription, metaImage, canonical, type]);
}
