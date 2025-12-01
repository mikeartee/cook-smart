# 🆓 FREE Deployment Guide - Cook Smart Website

## Total Cost: $0/month

Yes, you can deploy this entire website for FREE using free tiers of various services.

## Free Services Breakdown

### 1. Vercel (Hosting) - FREE ✅

**What's Included:**
- Unlimited websites
- 100 GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Automatic deployments from Git
- Preview deployments
- Analytics (basic)

**Cost**: $0/month

**Limits**: 
- 100 GB bandwidth (plenty for starting out)
- 100 GB-hours serverless function execution

### 2. Resend (Email) - FREE ✅

**What's Included:**
- 100 emails/day
- 3,000 emails/month
- Email API
- Email templates
- Delivery tracking

**Cost**: $0/month

**Perfect for**: Newsletter signups, contact form, auto-replies

### 3. Domain (Optional Cost)

**Free Option**: Use Vercel subdomain
- `your-project.vercel.app` - FREE

**Paid Option**: Custom domain
- `cooksmartapp.com` - ~$12/year (one-time annual cost)

## Step-by-Step FREE Deployment

### Step 1: Create Vercel Account (FREE)

1. Go to https://vercel.com
2. Sign up with GitHub (free)
3. No credit card required

### Step 2: Create Resend Account (FREE)

1. Go to https://resend.com
2. Sign up (free tier)
3. Get your API key
4. Verify your sending domain (or use Resend's domain for testing)

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from website folder
cd website
vercel --prod
```

### Step 4: Configure Environment Variables

In Vercel Dashboard:

```
NEXT_PUBLIC_API_URL=https://api.cooksmartapp.com
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Cook Smart <onboarding@resend.dev>
NEXT_PUBLIC_ANDROID_STORE_URL=your_play_store_url
NEXT_PUBLIC_IOS_STORE_URL=your_app_store_url
```

**Note**: Use `onboarding@resend.dev` for free tier testing

### Step 5: Done! 🎉

Your website is now live at: `https://your-project.vercel.app`

## Free Tier Limits

### Vercel
- ✅ 100 GB bandwidth/month (enough for ~100k page views)
- ✅ Unlimited websites
- ✅ Automatic SSL
- ✅ Global CDN

### Resend
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ Perfect for contact forms and newsletters

## When You'll Need to Pay

### Vercel
- If you exceed 100 GB bandwidth/month
- If you need advanced analytics
- If you need team features

**Typical cost**: Still $0 for most small-medium sites

### Resend
- If you send more than 3,000 emails/month
- If you need dedicated IP

**Typical cost**: $20/month for 50k emails

### Domain (Optional)
- Custom domain: ~$12/year
- Can use free Vercel subdomain indefinitely

## Cost Projection

### Month 1-6 (Launch Phase)
- **Hosting**: $0
- **Email**: $0
- **Domain**: $0 (use Vercel subdomain)
- **Total**: $0/month

### Month 6-12 (Growth Phase)
- **Hosting**: $0 (still within free tier)
- **Email**: $0 (likely still within 3k/month)
- **Domain**: $12/year = $1/month (optional)
- **Total**: $0-1/month

### Year 2+ (Scale Phase)
Only pay if you exceed free tiers:
- Vercel: $0 (unless >100 GB bandwidth)
- Resend: $0 (unless >3k emails/month)
- Domain: $12/year

## Alternative FREE Options

### Hosting Alternatives
1. **Netlify** - Similar to Vercel, 100 GB bandwidth free
2. **Cloudflare Pages** - Unlimited bandwidth (FREE!)
3. **GitHub Pages** - Static sites only, unlimited

### Email Alternatives
1. **SendGrid** - 100 emails/day free
2. **Mailgun** - 5,000 emails/month free (first 3 months)
3. **AWS SES** - 62,000 emails/month free (if on EC2)

## Recommended FREE Setup

```
✅ Vercel (hosting) - FREE
✅ Resend (email) - FREE
✅ Vercel subdomain - FREE
✅ GitHub (version control) - FREE

Total: $0/month
```

## Upgrade Path (When Needed)

### When to upgrade Vercel:
- Traffic exceeds 100 GB/month
- Need team collaboration
- Need advanced analytics

**Cost**: $20/month (Pro plan)

### When to upgrade Resend:
- Sending more than 3,000 emails/month
- Need dedicated IP

**Cost**: $20/month (Pro plan)

## Summary

**You can run the Cook Smart website completely FREE using:**
- Vercel free tier (hosting)
- Resend free tier (email)
- Vercel subdomain (no domain cost)

**Total monthly cost: $0**

**Optional upgrade**: Custom domain for $12/year ($1/month)

**The website will stay FREE until you exceed:**
- 100 GB bandwidth/month (Vercel)
- 3,000 emails/month (Resend)

For a new website, you'll likely stay within free tiers for 6-12 months or longer!

## Deploy Now - FREE!

```bash
cd website
vercel --prod
```

**No credit card required. No hidden fees. Actually free.** 🎉

