# PWA Icons Setup

This document describes the icon assets needed for the Tikit PWA.

## Required Icons

The following icon files need to be placed in the `apps/frontend/public/` directory:

### Main PWA Icons
- `pwa-192x192.png` - 192x192px PNG icon for Android
- `pwa-512x512.png` - 512x512px PNG icon for Android (also used as maskable icon)
- `apple-touch-icon.png` - 180x180px PNG icon for iOS home screen
- `favicon.ico` - 32x32px ICO file for browser tab
- `badge-72x72.png` - 72x72px PNG badge icon for notifications

### iOS Splash Screens
iOS requires specific splash screen images for different device sizes:

- `apple-splash-2048-2732.png` - iPad Pro 12.9" (2048x2732px)
- `apple-splash-1668-2388.png` - iPad Pro 11" (1668x2388px)
- `apple-splash-1536-2048.png` - iPad 9.7" (1536x2048px)
- `apple-splash-1125-2436.png` - iPhone X/XS/11 Pro (1125x2436px)
- `apple-splash-1242-2688.png` - iPhone XS Max/11 Pro Max (1242x2688px)
- `apple-splash-828-1792.png` - iPhone XR/11 (828x1792px)
- `apple-splash-1242-2208.png` - iPhone 8 Plus (1242x2208px)
- `apple-splash-750-1334.png` - iPhone 8/7/6s (750x1334px)
- `apple-splash-640-1136.png` - iPhone SE (640x1136px)

## Design Guidelines

### Brand Colors
- Primary: `#10b981` (Green - represents growth and trust)
- Background: `#ffffff` (White)
- Text: `#1f2937` (Dark gray)

### Icon Design
1. Use the Tikit logo with sufficient padding (20% margin)
2. Ensure the icon is recognizable at small sizes
3. Use a simple, bold design that works on both light and dark backgrounds
4. For maskable icons, keep important content within the safe zone (80% of canvas)

### Splash Screen Design
1. Use brand colors with the Tikit logo centered
2. Include a subtle loading indicator or tagline
3. Maintain consistent branding across all sizes
4. Optimize file sizes (use PNG compression)

## Generating Icons

You can use the following tools to generate icons from a source image:

### Online Tools
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) - Generates all required sizes
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive favicon generator
- [App Icon Generator](https://appicon.co/) - iOS and Android icons

### Command Line Tools
```bash
# Using ImageMagick to resize icons
convert source-icon.png -resize 192x192 pwa-192x192.png
convert source-icon.png -resize 512x512 pwa-512x512.png
convert source-icon.png -resize 180x180 apple-touch-icon.png

# Using sharp-cli for batch processing
npm install -g sharp-cli
sharp -i source-icon.png -o pwa-192x192.png resize 192 192
sharp -i source-icon.png -o pwa-512x512.png resize 512 512
```

## Placeholder Icons

For development purposes, you can create simple placeholder icons:

```bash
# Create a simple colored square as placeholder
convert -size 192x192 xc:#10b981 -gravity center -pointsize 72 -fill white -annotate +0+0 "T" pwa-192x192.png
convert -size 512x512 xc:#10b981 -gravity center -pointsize 192 -fill white -annotate +0+0 "T" pwa-512x512.png
convert -size 180x180 xc:#10b981 -gravity center -pointsize 72 -fill white -annotate +0+0 "T" apple-touch-icon.png
```

## Verification

After adding icons, verify they work correctly:

1. **Local Testing:**
   - Run `pnpm build` in the frontend directory
   - Serve the build with `pnpm preview`
   - Open DevTools > Application > Manifest to check icon loading

2. **Lighthouse Audit:**
   - Run Lighthouse PWA audit
   - Ensure all icon requirements pass
   - Check maskable icon support

3. **Device Testing:**
   - Test "Add to Home Screen" on Android
   - Test "Add to Home Screen" on iOS Safari
   - Verify splash screens display correctly on iOS

## Manifest Configuration

The PWA manifest is configured in `vite.config.ts` with the following settings:

```typescript
manifest: {
  name: 'Tikit - Event Ticketing Platform',
  short_name: 'Tikit',
  description: 'Nigerian event ticketing platform with offline support',
  theme_color: '#10b981',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: [...]
}
```

## Additional Resources

- [PWA Manifest Documentation](https://web.dev/add-manifest/)
- [iOS Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [Adaptive Icons](https://web.dev/adaptive-icon/)
