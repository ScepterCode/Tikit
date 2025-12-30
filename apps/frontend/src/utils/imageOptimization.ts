/**
 * Image optimization utilities for CDN delivery
 */

/**
 * Generate responsive image srcset
 */
export const generateSrcSet = (
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600]
): string => {
  return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = (
  breakpoints: Array<{ maxWidth: string; size: string }> = [
    { maxWidth: '640px', size: '100vw' },
    { maxWidth: '768px', size: '50vw' },
    { maxWidth: '1024px', size: '33vw' },
  ],
  defaultSize: string = '25vw'
): string => {
  const sizeStrings = breakpoints.map(
    (bp) => `(max-width: ${bp.maxWidth}) ${bp.size}`
  );
  sizeStrings.push(defaultSize);
  return sizeStrings.join(', ');
};

/**
 * Get optimized image URL with Cloudflare Image Resizing
 * Note: Requires Cloudflare Pro plan or higher
 */
export const getOptimizedImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  } = {}
): string => {
  const {
    width,
    height,
    quality = 85,
    format = 'auto',
    fit = 'scale-down',
  } = options;

  // Check if Cloudflare Image Resizing is available
  const useCloudflare = import.meta.env.VITE_USE_CLOUDFLARE_IMAGES === 'true';

  if (!useCloudflare) {
    // Fallback to query parameters for custom image service
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality !== 85) params.append('q', quality.toString());
    if (format !== 'auto') params.append('f', format);

    return params.toString() ? `${url}?${params.toString()}` : url;
  }

  // Cloudflare Image Resizing
  const params: string[] = [];
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  params.push(`quality=${quality}`);
  params.push(`format=${format}`);
  params.push(`fit=${fit}`);

  return `/cdn-cgi/image/${params.join(',')}/${url}`;
};

/**
 * Preload critical images
 */
export const preloadImage = (url: string, as: 'image' = 'image'): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (
  img: HTMLImageElement,
  options: IntersectionObserverInit = {}
): void => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        const src = image.dataset.src;
        const srcset = image.dataset.srcset;

        if (src) {
          image.src = src;
        }
        if (srcset) {
          image.srcset = srcset;
        }

        image.classList.remove('lazy');
        observer.unobserve(image);
      }
    });
  }, defaultOptions);

  observer.observe(img);
};

/**
 * Convert image to WebP format (client-side)
 * Note: This is for demonstration. In production, convert on server/CDN
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get image dimensions without loading the full image
 */
export const getImageDimensions = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Generate blur placeholder for progressive image loading
 */
export const generateBlurPlaceholder = (
  width: number = 10,
  height: number = 10
): string => {
  // This would typically be generated on the server
  // For now, return a simple data URL
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Create a simple gradient as placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.1);
};

/**
 * Image loading strategies
 */
export const IMAGE_LOADING_STRATEGIES = {
  EAGER: 'eager', // Load immediately
  LAZY: 'lazy', // Load when near viewport
  AUTO: 'auto', // Browser decides
} as const;

/**
 * Image fetch priorities
 */
export const IMAGE_FETCH_PRIORITIES = {
  HIGH: 'high', // Critical images (hero, above fold)
  LOW: 'low', // Non-critical images
  AUTO: 'auto', // Browser decides
} as const;
