# CDN Setup Guide

## Overview

This guide explains how to configure Cloudflare CDN for optimal static asset delivery and caching.

## Architecture

```
User Request → Cloudflare CDN → Vercel (Origin) → Application
                    ↓
              Cache Hit (Fast)
```

## Cloudflare Configuration

### 1. DNS Setup

1. Add your domain to Cloudflare
2. Update nameservers to Cloudflare's nameservers
3. Enable "Proxied" (orange cloud) for CDN

### 2. Caching Rules

#### Page Rules (Free Plan)

Create the following page rules in order:

**Rule 1: Cache Static Assets**
- URL: `*tikit.app/assets/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year

**Rule 2: Cache Images**
- URL: `*tikit.app/*.{jpg,jpeg,png,webp,svg,ico}`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
  - Browser Cache TTL: 1 week

**Rule 3: Bypass Cache for API**
- URL: `*tikit.app/api/*`
- Settings:
  - Cache Level: Bypass

#### Cache Rules (Pro Plan+)

For more granular control:

```javascript
// Cache static assets
if (http.request.uri.path matches "^/assets/.*") {
  cache.edge_ttl = 2592000; // 30 days
  cache.browser_ttl = 31536000; // 1 year
}

// Cache images
if (http.request.uri.path matches "\.(jpg|jpeg|png|webp|svg|ico)$") {
  cache.edge_ttl = 604800; // 7 days
  cache.browser_ttl = 604800; // 7 days
}

// Don't cache HTML
if (http.request.uri.path matches "\.html$") {
  cache.edge_ttl = 0;
  cache.browser_ttl = 0;
}
```

### 3. Performance Optimizations

#### Auto Minify
- Enable Auto Minify for:
  - ✅ JavaScript
  - ✅ CSS
  - ✅ HTML

#### Brotli Compression
- Enable Brotli compression (better than Gzip)
- Cloudflare automatically serves Brotli to supporting browsers

#### HTTP/3 (QUIC)
- Enable HTTP/3 for faster connection establishment
- Reduces latency by ~30% on mobile networks

#### Early Hints
- Enable Early Hints to preload critical resources
- Improves perceived performance

#### Rocket Loader
- ⚠️ Disable Rocket Loader (can break React apps)

### 4. Image Optimization

#### Cloudflare Images (Optional)

For automatic image optimization:

```javascript
// Use Cloudflare Image Resizing
const imageUrl = `https://tikit.app/cdn-cgi/image/width=800,quality=85,format=auto/${originalImageUrl}`;
```

Options:
- `width`: Resize width
- `height`: Resize height
- `quality`: 1-100 (default: 85)
- `format`: auto, webp, avif, jpeg, png
- `fit`: scale-down, contain, cover, crop, pad

#### Manual Optimization

For self-hosted images:

1. Convert to WebP format
2. Generate multiple sizes (responsive images)
3. Use lazy loading
4. Implement blur-up technique

```tsx
<img
  src="/images/event-large.webp"
  srcSet="/images/event-small.webp 400w, /images/event-medium.webp 800w, /images/event-large.webp 1200w"
  sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
  loading="lazy"
  alt="Event"
/>
```

### 5. Security Settings

#### SSL/TLS
- Mode: Full (strict)
- Minimum TLS Version: 1.2
- TLS 1.3: Enabled
- Automatic HTTPS Rewrites: Enabled

#### Firewall Rules
- Enable Bot Fight Mode
- Rate limiting: 100 requests per minute per IP
- Challenge on suspicious activity

#### DDoS Protection
- Cloudflare provides automatic DDoS protection
- No additional configuration needed

### 6. Analytics and Monitoring

#### Cloudflare Analytics

Monitor:
- Cache hit rate (target: > 95% for static assets)
- Bandwidth savings
- Response time improvements
- Geographic distribution of traffic

#### Real User Monitoring (RUM)

Enable Web Analytics for:
- Page load times
- Core Web Vitals
- User experience metrics

## Cache Headers

The `_headers` file configures cache behavior:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Cache-Control Directives

- `public`: Can be cached by any cache
- `private`: Only cached by browser
- `max-age`: Time in seconds to cache
- `immutable`: Content never changes (safe to cache forever)
- `must-revalidate`: Must check with origin before using stale cache

### Recommended TTLs

| Asset Type | Browser Cache | CDN Cache | Reason |
|------------|---------------|-----------|--------|
| JS/CSS (hashed) | 1 year | 1 month | Content-addressed, safe to cache |
| Images | 1 week | 1 week | May be updated occasionally |
| HTML | 0 | 0 | Contains dynamic content |
| Fonts | 1 year | 1 month | Rarely change |
| API responses | 0 | 0 | Dynamic data |

## Cache Invalidation

### Automatic Invalidation

Vite automatically adds content hashes to filenames:
- `main-abc123.js` → `main-def456.js` (on change)
- Old files are automatically invalidated
- No manual purge needed

### Manual Purge

If needed, purge Cloudflare cache:

```bash
# Purge everything (use sparingly)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purge specific files
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://tikit.app/assets/main.js"]}'
```

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Cache hit rate | > 95% | Proper cache headers, long TTLs |
| TTFB (Time to First Byte) | < 200ms | CDN edge caching |
| LCP (Largest Contentful Paint) | < 2.5s | Image optimization, code splitting |
| FID (First Input Delay) | < 100ms | Code splitting, lazy loading |
| CLS (Cumulative Layout Shift) | < 0.1 | Proper image dimensions |

## Monitoring Cache Performance

### Cloudflare Dashboard

Check:
1. **Analytics** → **Performance**
   - Cache hit rate
   - Bandwidth saved
   - Response time

2. **Caching** → **Configuration**
   - Cache rules
   - Purge history

### Browser DevTools

Check cache headers:

```javascript
// In browser console
fetch('https://tikit.app/assets/main.js')
  .then(r => {
    console.log('Cache-Control:', r.headers.get('cache-control'));
    console.log('CF-Cache-Status:', r.headers.get('cf-cache-status'));
  });
```

CF-Cache-Status values:
- `HIT`: Served from Cloudflare cache
- `MISS`: Not in cache, fetched from origin
- `EXPIRED`: In cache but expired
- `BYPASS`: Cache bypassed by rule

## Best Practices

### DO:
- ✅ Use content hashing for cache busting
- ✅ Set long cache TTLs for static assets
- ✅ Compress assets (Brotli > Gzip)
- ✅ Use WebP/AVIF for images
- ✅ Implement lazy loading
- ✅ Monitor cache hit rates

### DON'T:
- ❌ Cache HTML files (they contain dynamic content)
- ❌ Cache API responses (unless explicitly safe)
- ❌ Use short TTLs for static assets
- ❌ Forget to set immutable for hashed assets
- ❌ Serve unoptimized images

## Troubleshooting

### Low Cache Hit Rate

**Possible causes:**
1. Cache headers not set correctly
2. Query strings preventing caching
3. Cookies preventing caching
4. Cache rules not configured

**Solutions:**
1. Check `_headers` file
2. Remove unnecessary query strings
3. Use separate domain for static assets
4. Review Cloudflare page rules

### Stale Content

**Possible causes:**
1. Cache not purged after deployment
2. Browser cache too aggressive

**Solutions:**
1. Use content hashing (automatic with Vite)
2. Purge Cloudflare cache after deployment
3. Set appropriate max-age values

### Slow First Load

**Possible causes:**
1. Large bundle size
2. No code splitting
3. Unoptimized images

**Solutions:**
1. Analyze bundle with `vite build --analyze`
2. Implement code splitting
3. Optimize images (WebP, responsive)
4. Use lazy loading

## Cost Optimization

### Cloudflare Free Plan

Includes:
- Unlimited bandwidth
- Basic DDoS protection
- 3 page rules
- Shared SSL certificate

**Sufficient for:** MVP and early growth

### Cloudflare Pro Plan ($20/month)

Adds:
- 20 page rules
- Image optimization
- Mobile optimization
- Advanced analytics

**Recommended for:** Production with high traffic

## Deployment Checklist

- [ ] Domain added to Cloudflare
- [ ] DNS configured (proxied)
- [ ] SSL/TLS set to Full (strict)
- [ ] Page rules configured
- [ ] Auto Minify enabled
- [ ] Brotli compression enabled
- [ ] HTTP/3 enabled
- [ ] `_headers` file deployed
- [ ] Cache hit rate > 90%
- [ ] Performance tested (Lighthouse)
