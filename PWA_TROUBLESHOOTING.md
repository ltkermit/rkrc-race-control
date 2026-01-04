# PWA Troubleshooting Guide

## Issue: "Can't connect - not connected to the internet"

This error means the PWA hasn't cached the files yet, or the service worker isn't working properly.

## Quick Fix Checklist

### 1. Are you on HTTPS?
- ✅ `https://control.rkrc.club` - Will work
- ❌ `http://control.rkrc.club` - Won't work
- ❌ `file:///path/to/index.html` - Won't work

**Service workers ONLY work on HTTPS** (except localhost for development).

### 2. Did you visit online first?
PWAs work like this:
1. **First visit (ONLINE)** → Downloads and caches files
2. **Subsequent visits (OFFLINE)** → Loads from cache

You MUST visit online first to populate the cache.

### 3. Check for Service Worker Errors

**On Desktop (Chrome/Safari):**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for `[PWA] ServiceWorker registered successfully`
4. Go to Application → Service Workers
5. Should show "Activated and running"

**On iOS Safari:**
1. Connect iPhone to Mac
2. Safari → Develop → [Your iPhone] → [Page]
3. Check Console for errors

## Common Problems & Solutions

### Problem 1: Service Worker Not Registering

**Symptom:** No `[PWA]` messages in console

**Causes:**
- Not on HTTPS
- JavaScript errors preventing registration
- Browser doesn't support service workers

**Solution:**
```javascript
// Check if service workers supported
if ('serviceWorker' in navigator) {
  console.log('Service workers supported!');
} else {
  console.log('Service workers NOT supported');
}
```

### Problem 2: Cache Not Populating

**Symptom:** Service worker registered but offline doesn't work

**Possible Issues:**
1. **File paths wrong** - Service worker paths must match actual file locations
2. **CORS issues** - Files must be from same origin
3. **Network errors** - Some files failed to download

**Debug:**
```javascript
// Check what's cached (in browser console)
caches.keys().then(keys => console.log('Cache keys:', keys));
caches.open('rkrc-race-control-v1.7.1').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached files:', keys.length);
    keys.forEach(k => console.log(k.url));
  });
});
```

### Problem 3: Path Issues

**Our service worker uses absolute paths starting with `/`:**
```javascript
'/audio/america/start-engines.mp3'
```

**This assumes files are at root:**
```
https://control.rkrc.club/audio/america/start-engines.mp3
```

**If deployed to subdirectory, paths need adjustment:**
```
https://example.com/race-control/audio/...
```

Would need:
```javascript
'/race-control/audio/america/start-engines.mp3'
```

### Problem 4: iOS Safari Specific Issues

**iOS Safari has quirks:**
1. Service worker may not persist if device is low on storage
2. Cache can be cleared more aggressively than desktop
3. Must add to home screen for best offline experience

**Solution:**
- Add to Home Screen (not just bookmark)
- Ensure device has enough free space
- Test with smaller cache first

## Testing Procedure for iOS

### Method 1: Simple Test (Using Site)

1. **Connect to WiFi**
2. Open Safari on iPhone
3. Navigate to `https://control.rkrc.club`
4. Wait for page to fully load (watch network activity)
5. Check console: Connect iPhone to Mac, Safari → Develop
6. Should see: `[PWA] ServiceWorker registered successfully`
7. **Turn on Airplane Mode**
8. Refresh page → Should load from cache
9. Or close Safari and reopen → Should work offline

### Method 2: Install as PWA

1. **While online:**
   - Open Safari → https://control.rkrc.club
   - Tap Share button (square with arrow up)
   - Scroll down → "Add to Home Screen"
   - Tap "Add"

2. **Icon appears on home screen**

3. **Go offline:**
   - Turn on Airplane Mode
   - Open app from home screen
   - Should work completely offline

### Method 3: Check Cache Status

**On Mac with iPhone connected:**

```javascript
// In Safari Web Inspector connected to iPhone
// Console tab:

// Check service worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg?.active?.state);
  console.log('SW URL:', reg?.active?.scriptURL);
});

// Check cache
caches.keys().then(keys => {
  console.log('Available caches:', keys);
  return caches.open('rkrc-race-control-v1.7.1');
}).then(cache => {
  return cache.keys();
}).then(requests => {
  console.log(`Cached ${requests.length} files`);
  requests.forEach(req => console.log(req.url));
});
```

## Debugging Service Worker Issues

### Check Service Worker File

Is the service worker accessible?
```
https://control.rkrc.club/service-worker.js
```

Should return the JavaScript file (not 404).

### Check Manifest

Is the manifest accessible?
```
https://control.rkrc.club/manifest.json
```

Should return JSON.

### Check Console for Errors

Common errors:
- `Failed to register a ServiceWorker: The script has an unsupported MIME type`
  → Server sending wrong content-type (should be `application/javascript`)

- `SecurityError: Failed to register a ServiceWorker: The origin of the provided scriptURL does not match the current origin`
  → Service worker not from same domain

- `TypeError: Failed to fetch`
  → Service worker trying to cache file that doesn't exist

## Quick Diagnostic

Run this in browser console while on the site:

```javascript
// Comprehensive PWA diagnostic
(async function diagnose() {
  console.log('=== PWA Diagnostic ===');

  // Check HTTPS
  console.log('Protocol:', window.location.protocol);
  console.log('HTTPS:', window.location.protocol === 'https:' ? '✅' : '❌');

  // Check Service Worker support
  console.log('SW Supported:', 'serviceWorker' in navigator ? '✅' : '❌');

  // Check registration
  const reg = await navigator.serviceWorker.getRegistration();
  console.log('SW Registered:', reg ? '✅' : '❌');

  if (reg) {
    console.log('SW State:', reg.active?.state);
    console.log('SW Script:', reg.active?.scriptURL);
  }

  // Check caches
  const keys = await caches.keys();
  console.log('Cache Keys:', keys);

  if (keys.length > 0) {
    const cache = await caches.open(keys[0]);
    const cached = await cache.keys();
    console.log(`Cached Files: ${cached.length}`);
    console.log('Cache Size:', cached.length > 0 ? '✅' : '❌');
  } else {
    console.log('No caches found ❌');
  }

  console.log('=== End Diagnostic ===');
})();
```

## Likely Issues for Your Setup

Based on "can't connect - not connected to internet" error on iOS:

### Most Likely:
1. **Testing offline before first online visit**
   - Solution: Visit online first, wait for cache, THEN test offline

2. **Service worker not registering due to HTTPS issue**
   - Solution: Ensure site is served over HTTPS

### Less Likely:
3. **Path issues in service worker**
4. **Files failing to cache**
5. **iOS Safari privacy settings blocking service workers**

## Next Steps

1. **Confirm deployment:**
   - Is site live at https://control.rkrc.club?
   - Is it served over HTTPS?

2. **Test online first:**
   - Visit site while connected
   - Check console for SW registration
   - Wait for all files to cache

3. **Then test offline:**
   - Turn on Airplane Mode
   - Refresh or reopen site
   - Should work from cache

4. **If still failing:**
   - Share console errors
   - Check Network tab for failed requests
   - Verify service worker is active

---

**Last Updated:** 2026-01-04
**Version:** v1.7.1
