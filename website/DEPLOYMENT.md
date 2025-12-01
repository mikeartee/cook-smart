# Deployment Guide

## Vercel Deployment

### Prerequisites
- GitHub repository with the website code
- Vercel account (free tier is sufficient for beta)

### Initial Setup

1. **Connect GitHub Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `website` folder as the root directory

2. **Configure Environment Variables**
   
   In Vercel dashboard, add these environment variables:
   
   **Production:**
   - `NEXT_PUBLIC_API_URL` = `https://api.cooksmartapp.com`
   - `RESEND_API_KEY` = `your_resend_api_key`
   - `NEXT_PUBLIC_ANDROID_STORE_URL` = `your_android_store_url`
   - `NEXT_PUBLIC_IOS_STORE_URL` = `your_ios_store_url`
   
   **Preview (optional):**
   - Same as production or use staging API URL

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Root Directory: `website`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your site
   - You'll get a URL like `https://your-project.vercel.app`

### Automatic Deployments

Once connected, Vercel will automatically:
- Deploy to production when you push to `main` branch
- Create preview deployments for pull requests
- Run builds and tests before deploying

### Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `cooksmartapp.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificate

### Monitoring

- **Analytics**: Enabled by default in Vercel dashboard
- **Logs**: View real-time logs in Vercel dashboard
- **Performance**: Monitor Core Web Vitals in Analytics tab

### Rollback

If a deployment has issues:
1. Go to Deployments tab
2. Find the previous working deployment
3. Click "..." menu > "Promote to Production"

### Environment-Specific Deployments

**Production:**
- Branch: `main`
- URL: `https://cooksmartapp.com`
- Auto-deploy: Yes

**Preview:**
- Branch: Any PR or branch
- URL: `https://your-project-git-branch.vercel.app`
- Auto-deploy: Yes

### Cost Considerations

**Vercel Free Tier Includes:**
- 100GB bandwidth per month
- Unlimited deployments
- Automatic HTTPS
- Preview deployments
- Analytics

**When to Upgrade ($20/month):**
- Exceeding 100GB bandwidth
- Need team collaboration features
- Want advanced analytics

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `npm run build` works locally

### Environment Variables Not Working
- Make sure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables

### 404 Errors
- Check that routes are properly defined in `app/` directory
- Verify dynamic routes have proper `[param]` syntax

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## CI/CD Pipeline

Vercel automatically runs:
1. Install dependencies
2. Run linting (`npm run lint`)
3. Run type checking (`npm run type-check`)
4. Run tests (`npm test`)
5. Build application (`npm run build`)
6. Deploy to Vercel

If any step fails, deployment is cancelled.
