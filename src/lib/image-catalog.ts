/**
 * Central catalog of shareable images.
 * Add entries here as you place files in /public/images/.
 * The bot references these by key; the UI renders them as <img>.
 */

export interface CatalogImage {
  key: string;
  src: string;
  alt: string;
  category: 'portfolio' | 'materials' | 'before-after';
}

export const IMAGE_CATALOG: CatalogImage[] = [
  // ── Portfolio ────────────────────────────────────────────────
  { key: 'portfolio-1',  src: '/images/portfolio/1.webp',  alt: 'Premium wallpaper installation showcase 1',  category: 'portfolio' },
  { key: 'portfolio-2',  src: '/images/portfolio/2.jpg',   alt: 'Premium wallpaper installation showcase 2',  category: 'portfolio' },
  { key: 'portfolio-3',  src: '/images/portfolio/3.webp',  alt: 'Premium wallpaper installation showcase 3',  category: 'portfolio' },
  { key: 'portfolio-4',  src: '/images/portfolio/4.webp',  alt: 'Premium wallpaper installation showcase 4',  category: 'portfolio' },
  { key: 'portfolio-5',  src: '/images/portfolio/5.webp',  alt: 'Premium wallpaper installation showcase 5',  category: 'portfolio' },
  { key: 'portfolio-6',  src: '/images/portfolio/6.webp',  alt: 'Premium wallpaper installation showcase 6',  category: 'portfolio' },
  { key: 'portfolio-7',  src: '/images/portfolio/7.webp',  alt: 'Premium wallpaper installation showcase 7',  category: 'portfolio' },
  { key: 'portfolio-8',  src: '/images/portfolio/8.webp',  alt: 'Premium wallpaper installation showcase 8',  category: 'portfolio' },
  { key: 'portfolio-9',  src: '/images/portfolio/9.webp',  alt: 'Premium wallpaper installation showcase 9',  category: 'portfolio' },
  { key: 'portfolio-10', src: '/images/portfolio/10.webp', alt: 'Premium wallpaper installation showcase 10', category: 'portfolio' },
  { key: 'portfolio-12', src: '/images/portfolio/12.webp', alt: 'Premium wallpaper installation showcase 11', category: 'portfolio' },

  // ── Materials ────────────────────────────────────────────────
  // { key: 'silk-texture', src: '/images/materials/silk-texture.jpg', alt: 'Silk-textured wallpaper sample', category: 'materials' },

  // ── Before & After ──────────────────────────────────────────
  // { key: 'living-room-ba', src: '/images/before-after/living-room.jpg', alt: 'Living room transformation', category: 'before-after' },
];

export function getImagesByCategory(category: CatalogImage['category']): CatalogImage[] {
  return IMAGE_CATALOG.filter(img => img.category === category);
}

export function getImageByKey(key: string): CatalogImage | undefined {
  return IMAGE_CATALOG.find(img => img.key === key);
}
