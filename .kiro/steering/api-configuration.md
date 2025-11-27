---
inclusion: always
---

# API Configuration Rules

## Critical Rule: Production URLs in Release Builds

**ALWAYS ensure release builds use production API URLs, never local development URLs.**

## Current Configuration

The API configuration in `src/config/api.ts` is set up to:
- Use local development server (`http://192.168.12.196:3000`) during development
- **ALWAYS use production server (`https://api.cooksmartapp.com`) in release builds**

## Why This Matters

If release builds use local development URLs:
- ❌ App will fail to connect when not on local network
- ❌ Users will see "JSON Parse error" or connection errors
- ❌ App appears broken to all users

## Implementation

```typescript
// IMPORTANT: Always use production URL in release builds
const isDevelopment = __DEV__ && !process.env.REACT_APP_FORCE_PRODUCTION;

export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local development only
  : 'https://api.cooksmartapp.com'; // Production (used in all release builds)
```

## When Making Changes

Whenever you modify API configuration:
1. ✅ Verify production URL is correct
2. ✅ Ensure release builds use production
3. ✅ Test locally first with development URL
4. ✅ Build release APK and verify it connects to production
5. ✅ Never hardcode local IPs in production code

## Testing

### Development:
```bash
npm start
# Should connect to http://192.168.12.196:3000
```

### Release Build:
```bash
cd android
gradlew assembleRelease
# APK should connect to https://api.cooksmartapp.com
```

## Common Mistakes to Avoid

❌ **Don't do this:**
```typescript
export const API_BASE_URL = 'http://192.168.12.196:3000'; // Hardcoded local
```

❌ **Don't do this:**
```typescript
const isDevelopment = __DEV__; // __DEV__ can be true in release builds
```

✅ **Do this:**
```typescript
const isDevelopment = __DEV__ && !process.env.REACT_APP_FORCE_PRODUCTION;
export const API_BASE_URL = isDevelopment ? LOCAL_URL : PRODUCTION_URL;
```

## Production Checklist

Before releasing any APK:
- [ ] Verify `API_BASE_URL` points to `https://api.cooksmartapp.com` in release
- [ ] Test login on release APK
- [ ] Verify all API calls work on release APK
- [ ] Check no hardcoded local IPs in code

## Emergency Fix

If users report connection issues:
1. Check if they're using release or debug build
2. Verify API_BASE_URL in the build
3. Rebuild with correct configuration if needed
4. Deploy fixed APK immediately

---

**Remember:** Production users should NEVER connect to local development servers.

