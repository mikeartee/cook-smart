# Cook Smart Website - Deployment Checklist

## Pre-Deployment Verification

### Build Status
- [x] TypeScript compilation: PASSED
- [x] Production build: PASSED (5.5s)
- [x] All tests passing: 115/115 tests
- [x] Zero production code errors

### Environment Variables Required

Create these in Vercel/deployment platform:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.cooksmartapp.com
NEXT_PUBLIC_SITE_URL=https://cooksmartapp.com

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# App Store Links
NEXT_PUBLIC_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.cooksmartapp
NEXT_PUBLIC_IOS_STORE_URL=https://apps.apple.com/app/cook-smart/id123456789
```

## Deployment Steps

### 1. Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd website
vercel --prod
```

### 2. Configure Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all required variables above
5. Redeploy if needed

### 3. Configure Custom Domain

1. In Vercel Dashboard > Domains
2. Add: cooksmartapp.com
3. Add: www.cooksmartapp.com
4. Update DNS records as instructed

### 4. Verify Deployment

- [ ] Homepage loads correctly
- [ ] Recipe pages work
- [ ] Blog pages work
- [ ] Contact form sends emails
- [ ] Newsletter signup works
- [ ] FAQ search works
- [ ] All images load
- [ ] Mobile responsive
- [ ] Security headers present

## Post-Deployment

### Monitor

- Check Vercel Analytics
- Monitor error logs
- Test all forms
- Verify API connectivity

### DNS Configuration

Point your domain to Vercel:

```
A Record: @ -> 76.76.21.21
CNAME: www -> cname.vercel-dns.com
```

## Quick Deploy Commands

```bash
# From project root
cd website

# Install dependencies
npm install

# Build locally to verify
npm run build

# Deploy to Vercel
vercel --prod
```

## Rollback Plan

If issues occur:

```bash
# Rollback to previous deployment in Vercel Dashboard
# Or redeploy previous commit
vercel --prod --force
```

## Production URLs

- **Website**: https://cooksmartapp.com
- **API**: https://api.cooksmartapp.com
- **Admin** (future): https://cooksmartapp.com/admin

## Support

- Vercel Support: https://vercel.com/support
- Next.js Docs: https://nextjs.org/docs

## Status: READY FOR DEPLOYMENT ✅

All checks passed. Website is production-ready.

