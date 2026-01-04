# PWA App Icons Guide

## Required Icons for Full PWA Support

To complete the PWA implementation, you need to create app icons in the following sizes. These icons should be saved in the `/img/` directory.

## Icon Sizes Needed

### For Web App Manifest (Android & Desktop)
- `icon-72.png` - 72x72 pixels
- `icon-96.png` - 96x96 pixels
- `icon-128.png` - 128x128 pixels
- `icon-144.png` - 144x144 pixels
- `icon-152.png` - 152x152 pixels
- `icon-192.png` - 192x192 pixels ⭐ (Primary Android icon)
- `icon-384.png` - 384x384 pixels
- `icon-512.png` - 512x512 pixels ⭐ (High resolution, required)

### For iOS Specific
- `icon-167.png` - 167x167 pixels (iPad Pro)
- `icon-180.png` - 180x180 pixels ⭐ (iPhone, primary)

## Icon Design Guidelines

### Source Material
Use your existing logo: `img/logo-v4-no-tag.png`

### Design Requirements
1. **Square Format**: All icons must be perfect squares
2. **No Transparency**: Use solid background color (#2ecc71 green recommended)
3. **Safe Zone**: Keep important elements 10% away from edges
4. **Simplicity**: Icon should be recognizable at small sizes (72x72)
5. **Centered**: Logo should be centered with some padding

### Recommended Design
```
┌─────────────────────┐
│                     │
│   ┌───────────┐     │
│   │           │     │
│   │   RKRC    │     │  <- Logo centered
│   │   Logo    │     │
│   │           │     │
│   └───────────┘     │
│                     │
└─────────────────────┘
Background: #2ecc71 (green)
```

## How to Create Icons

### Option 1: Use Online Tool (Easiest)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your `logo-v4-no-tag.png`
3. Set background color to `#2ecc71`
4. Generate all sizes
5. Download and place in `/img/` directory

### Option 2: Use Photoshop/GIMP
1. Open `logo-v4-no-tag.png`
2. Create new 512x512 canvas with #2ecc71 background
3. Center and resize logo to ~400x400 (leave padding)
4. Export as `icon-512.png`
5. Resize canvas to other sizes and export each

### Option 3: ImageMagick (Command Line)
```bash
# Navigate to img directory
cd img

# Create 512x512 base icon (adjust paths as needed)
convert logo-v4-no-tag.png -background "#2ecc71" -gravity center -extent 512x512 icon-512.png

# Generate all other sizes
convert icon-512.png -resize 384x384 icon-384.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 180x180 icon-180.png
convert icon-512.png -resize 167x167 icon-167.png
convert icon-512.png -resize 152x152 icon-152.png
convert icon-512.png -resize 144x144 icon-144.png
convert icon-512.png -resize 128x128 icon-128.png
convert icon-512.png -resize 96x96 icon-96.png
convert icon-512.png -resize 72x72 icon-72.png
```

## Optional: Screenshots

For enhanced PWA install prompts on Android, add screenshots:
- `screenshot-mobile.png` - 540x720 pixels (portrait phone screenshot)
- `screenshot-desktop.png` - 1280x720 pixels (landscape desktop screenshot)

These are optional but improve the installation experience on Android.

## Testing Icons

### On Android
1. Open Chrome DevTools
2. Go to Application > Manifest
3. Check that all icons load correctly
4. Verify no 404 errors

### On iOS
1. Add to Home Screen
2. Check that icon appears correctly on home screen
3. Verify splash screen shows properly

### Using Lighthouse
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run PWA audit
4. Check for icon warnings

## Current Status

❌ **Icons Not Yet Created** - PWA will work but won't have proper app icons

Once you create these icons:
1. Save them to `/img/` directory
2. Verify paths in `manifest.json` match
3. Test on both iOS and Android
4. Clear cache and re-add to home screen to see new icons

## Quick Checklist

- [ ] Create icon-512.png (base high-res icon)
- [ ] Create icon-192.png (Android primary)
- [ ] Create icon-180.png (iOS primary)
- [ ] Create icon-152.png (iPad)
- [ ] Create icon-167.png (iPad Pro)
- [ ] Create all other sizes (144, 128, 96, 72)
- [ ] Test on Android Chrome
- [ ] Test on iOS Safari
- [ ] Run Lighthouse PWA audit

## Notes

- All icon files should be PNG format
- Use consistent branding across all sizes
- Icons can be created after deployment - PWA will still work with placeholders
- Favicon.ico can remain as-is - it's separate from PWA icons

---

**Last Updated:** 2026-01-04
**PWA Version:** v1.7.0
