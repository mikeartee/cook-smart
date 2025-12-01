# Free Deployment Guide - Cook Smart Website

**Goal:** Deploy the website with $0-5/month cost  
**Time Required:** 30-60 minutes  
**Difficulty:** Beginner-friendly

---

## Overview

We'll use 100% free services:
- **Vercel** - Website hosting (FREE)
- **Vercel Postgres** - Database (FREE tier)
- **Resend** - Email sending (FREE tier: 3,000 emails/month)
- **GitHub** - Code repository (FREE)

**Total Monthly Cost: $0** 🎉

---

## Prerequisites

Before starting, create accounts (all free):

1. **GitHub Account** - https://github.com/signup
2. **Vercel Account** - https://vercel.com/signup (sign up with GitHub)
3. **Resend Account** - https://resend.com/signup

---

## Step 1: Prepare Your Code (5 minutes)

### 1.1 Initialize Git Repository

```bash
cd website

# Initialize git if not already done
git init

# Create .gitignore (should already exist)
# Verify it includes:
# node_modules/
# .next/
# .env.local
# .env
```

### 1.2 Update Environment Variables

Create `.env.example` file:

```bash
# Copy this to .env.local for local development
# Set these in Vercel dashboard for production

# Required
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_API_URL=https://your-site.vercel.app
RESEND_API_KEY=re_your_key_here

# Optional
NEXT_PUBLIC_ANDROID_STORE_URL=
NEXT_PUBLIC_IOS_STORE_URL=

# Database (Vercel will auto-populate these)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
```

### 1.3 Verify Build Works

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ 45 pages generated
```

---

## Step 2: Push to GitHub (10 minutes)

### 2.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `cook-smart-website`
3. Description: `Cook Smart - Recipe and meal planning website`
4. Visibility: **Private** (recommended)
5. Click **Create repository**

### 2.2 Push Your Code

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit - Complete website with legal compliance"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/cook-smart-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Verify:** Visit your GitHub repository - you should see all files

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Import Project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `cook-smart-website` repository
4. Click **Import**

### 3.2 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as is)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

**Install Command:** `npm install` (auto-filled)

### 3.3 Add Environment Variables

Click **Environment Variables** and add:

```
NEXT_PUBLIC_SITE_URL = https://your-project.vercel.app
NEXT_PUBLIC_API_URL = https://your-project.vercel.app
RESEND_API_KEY = (leave empty for now, we'll add this next)
```

**Note:** Replace `your-project` with your actual Vercel project name

### 3.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. You'll see "Congratulations!" when done

**Your site is now live!** 🎉

---

## Step 4: Set Up Email (Resend) (10 minutes)

### 4.1 Get Resend API Key

1. Go to https://resend.com/api-keys
2. Click **Create API Key**
3. Name: `Cook Smart Production`
4. Permission: **Sending access**
5. Click **Create**
6. **Copy the API key** (you won't see it again!)

### 4.2 Add Domain (Optional but Recommended)

**Option A: Use Resend's Domain (Easiest)**
- Emails will come from `onboarding@resend.dev`
- No setup required
- FREE

**Option B: Use Your Own Domain (Better branding)**
1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter your domain: `cooksmartapp.com`
4. Add DNS records (provided by Resend)
5. Wait for verification (5-30 minutes)

**For now, use Option A to get started quickly**

### 4.3 Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** (paste your API key)
   - **Environment:** Production, Preview, Development
4. Click **Save**

### 4.4 Redeploy

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

**Emails now work!** 📧

---

## Step 5: Set Up Database (Optional - 10 minutes)

**Note:** Only needed if you want to store user data, subscriptions, etc.

### 5.1 Create Vercel Postgres Database

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Database name: `cook-smart-db`
5. Region: Choose closest to your users
6. Click **Create**

### 5.2 Connect to Project

1. Click **Connect Project**
2. Select your `cook-smart-website` project
3. Click **Connect**

**Vercel automatically adds these environment variables:**
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 5.3 Set Up Database Schema (Future)

When you're ready to use the database:

```bash
# Install Prisma
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init

# Create your schema in prisma/schema.prisma
# Then run:
npx prisma db push
```

**For now, skip this - the website works without a database**

---

## Step 6: Configure Custom Domain (Optional - 15 minutes)

### 6.1 Buy a Domain (if you don't have one)

**Free/Cheap Options:**
- **Freenom** - Free domains (.tk, .ml, .ga, .cf, .gq)
- **Namecheap** - $8.88/year (.com)
- **Porkbun** - $9.13/year (.com)
- **Google Domains** - $12/year (.com)

### 6.2 Add Domain to Vercel

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Enter your domain: `cooksmartapp.com`
3. Click **Add**

### 6.3 Configure DNS

Vercel will show you DNS records to add:

**Option A: Use Vercel Nameservers (Easiest)**
1. Copy Vercel's nameservers
2. Go to your domain registrar
3. Update nameservers
4. Wait 24-48 hours for propagation

**Option B: Add A/CNAME Records**
1. Add A record: `76.76.21.21`
2. Add CNAME record: `cname.vercel-dns.com`
3. Wait 5-30 minutes for propagation

### 6.4 Update Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL` to your domain
3. Update `NEXT_PUBLIC_API_URL` to your domain
4. Redeploy

**Your site is now on your custom domain!** 🌐

---

## Step 7: Verify Everything Works (10 minutes)

### 7.1 Test Website

Visit your site and check:

- [ ] Homepage loads
- [ ] All legal pages load (`/legal/*`)
- [ ] Recipe pages load (`/recipes`)
- [ ] Blog loads (`/blog`)
- [ ] Contact form loads (`/contact`)

### 7.2 Test Forms

- [ ] Newsletter signup works
- [ ] Contact form works
- [ ] Data request form works
- [ ] Email preferences work
- [ ] Unsubscribe works

### 7.3 Test Email

1. Subscribe to newsletter
2. Check your email
3. Verify confirmation email arrives
4. Click unsubscribe link
5. Verify unsubscribe works

### 7.4 Test Legal Compliance

- [ ] Cookie banner appears on first visit
- [ ] Cookie preferences save
- [ ] Recipe disclaimers show
- [ ] Footer links work
- [ ] All legal pages accessible

### 7.5 Test Accessibility

- [ ] Tab through page with keyboard
- [ ] Skip to content link works
- [ ] All buttons/links accessible
- [ ] Forms have labels

---

## Step 8: Monitor and Maintain (Ongoing)

### 8.1 Set Up Monitoring

**Vercel Analytics (FREE)**
1. Go to **Analytics** tab
2. Enable Web Analytics
3. Monitor page views, performance

**Vercel Speed Insights (FREE)**
1. Go to **Speed Insights** tab
2. Enable Speed Insights
3. Monitor Core Web Vitals

### 8.2 Set Up Error Tracking (Optional)

**Sentry (FREE tier: 5,000 errors/month)**
1. Sign up at https://sentry.io
2. Create new project (Next.js)
3. Follow integration guide
4. Add to your project

### 8.3 Regular Maintenance

**Weekly:**
- Check Vercel dashboard for errors
- Review analytics
- Test contact form

**Monthly:**
- Review email sending (Resend dashboard)
- Check for security updates
- Review user feedback

**Quarterly:**
- Update dependencies (`npm update`)
- Review legal documents
- Run accessibility tests

---

## Cost Breakdown

### Free Tier Limits

**Vercel (FREE)**
- Bandwidth: 100 GB/month
- Builds: 6,000 minutes/month
- Serverless Functions: 100 GB-hours
- **Cost:** $0/month

**Vercel Postgres (FREE)**
- Storage: 256 MB
- Compute: 60 hours/month
- **Cost:** $0/month

**Resend (FREE)**
- Emails: 3,000/month
- Domains: 1
- **Cost:** $0/month

**GitHub (FREE)**
- Private repos: Unlimited
- Storage: 500 MB
- **Cost:** $0/month

**Total: $0/month** 🎉

### When You'll Need to Upgrade

**Vercel Pro ($20/month):**
- When you exceed 100 GB bandwidth
- When you need more than 6,000 build minutes
- When you need team collaboration

**Resend Pro ($20/month):**
- When you exceed 3,000 emails/month
- When you need dedicated IP
- When you need priority support

**Vercel Postgres ($20/month):**
- When you exceed 256 MB storage
- When you need more compute hours

**Estimated upgrade point:** 1,000-5,000 monthly visitors

---

## Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Solution: Install dependencies
npm install
npm run build
```

**Error:** "Environment variable not set"
```bash
# Solution: Add to Vercel dashboard
# Settings → Environment Variables
```

### Emails Not Sending

**Check:**
1. RESEND_API_KEY is set in Vercel
2. API key has "Sending access" permission
3. Check Resend dashboard for errors
4. Verify email addresses are valid

### Site Not Loading

**Check:**
1. Deployment succeeded (Vercel dashboard)
2. Domain DNS is configured correctly
3. Environment variables are set
4. No build errors in logs

### Forms Not Working

**Check:**
1. API routes are deployed (`/api/*`)
2. Environment variables are set
3. Check browser console for errors
4. Check Vercel function logs

---

## Next Steps

### Immediate (After Deployment)

1. **Test everything** - Go through verification checklist
2. **Monitor errors** - Check Vercel dashboard daily
3. **Collect feedback** - Share with friends/family

### Within 1 Week

4. **Set up custom domain** - If you haven't already
5. **Configure email domain** - Use your own domain for emails
6. **Add analytics** - Enable Vercel Analytics
7. **Test on mobile** - Verify mobile experience

### Within 1 Month

8. **Run accessibility audit** - Use axe, WAVE, Lighthouse
9. **Get user feedback** - Ask real users to test
10. **Optimize performance** - Check Speed Insights
11. **Update content** - Add more recipes, blog posts

### Within 3 Months

12. **Review analytics** - Understand user behavior
13. **Implement improvements** - Based on feedback
14. **Scale if needed** - Upgrade plans if necessary
15. **Marketing** - Start promoting your site

---

## Support Resources

### Documentation

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Resend Docs:** https://resend.com/docs

### Community

- **Vercel Discord:** https://vercel.com/discord
- **Next.js Discord:** https://nextjs.org/discord
- **Stack Overflow:** Tag questions with `next.js`, `vercel`

### Getting Help

1. Check Vercel function logs
2. Check browser console
3. Search documentation
4. Ask in Discord communities
5. Create GitHub issue

---

## Deployment Checklist

### Pre-Deployment ✅

- [x] Code is complete
- [x] Build succeeds locally
- [x] All tests pass
- [x] Environment variables documented
- [x] .gitignore configured

### Deployment ✅

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] First deployment successful

### Post-Deployment ✅

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Forms work
- [ ] Emails send
- [ ] Legal pages load
- [ ] Cookie banner works

### Optional ✅

- [ ] Custom domain configured
- [ ] Email domain configured
- [ ] Database set up
- [ ] Analytics enabled
- [ ] Error tracking enabled

---

## Quick Reference

### Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Update dependencies
npm update
```

### Important URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/YOUR_USERNAME/cook-smart-website
- **Resend Dashboard:** https://resend.com/emails
- **Your Website:** https://your-project.vercel.app

### Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_API_URL=https://your-site.vercel.app
RESEND_API_KEY=re_your_key_here
```

---

## Success! 🎉

Your Cook Smart website is now live and fully compliant with:
- ✅ GDPR
- ✅ CCPA
- ✅ COPPA
- ✅ WCAG 2.1 AA
- ✅ CAN-SPAM
- ✅ CASL

**Total Cost: $0/month**

**Next:** Share your site and start getting users!

---

**Last Updated:** November 30, 2025  
**Deployment Time:** 30-60 minutes  
**Monthly Cost:** $0 (free tier)  
**Upgrade Cost:** $20/month (when needed)
