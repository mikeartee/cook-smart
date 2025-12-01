# AWS Deployment Guide - Cook Smart Website

**Infrastructure:** AWS (Existing)  
**Domain:** cooksmartapp.com (Owned)  
**Time Required:** 45-90 minutes  
**Cost:** Uses existing AWS resources

---

## Overview

We'll deploy using your existing AWS infrastructure:
- **AWS Amplify** or **AWS S3 + CloudFront** - Website hosting
- **AWS RDS** - Database (existing)
- **AWS SES** - Email sending (existing)
- **Route 53** - DNS management (existing)

**Recommended:** AWS Amplify (easiest for Next.js)

---

## Option 1: AWS Amplify (Recommended - Easiest)

### Why Amplify?
- ✅ Built for Next.js
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Easy environment variables
- ✅ Serverless functions included
- ✅ Free tier: 1,000 build minutes/month

### Step 1: Create Amplify App (10 minutes)

1. **Go to AWS Amplify Console**
   - https://console.aws.amazon.com/amplify/
   - Select your region (same as your RDS)

2. **Create New App**
   - Click **New app** → **Host web app**
   - Select **GitHub**
   - Authorize AWS Amplify to access GitHub

3. **Select Repository**
   - Repository: `tootallgames2020/cook-smart`
   - Branch: `fresh-project-migration` (or `main`)
   - Click **Next**

4. **Configure Build Settings**
   
   **App name:** `cook-smart-website`
   
   **Build and test settings:**
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - cd website
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: website/.next
           files:
             - '**/*'
         cache:
           paths:
             - website/node_modules/**/*
   ```

   **Advanced settings:**
   - **Base directory:** `website`
   - Click **Next**

5. **Review and Deploy**
   - Review settings
   - Click **Save and deploy**
   - Wait 5-10 minutes for first deployment

### Step 2: Configure Environment Variables (5 minutes)

1. **In Amplify Console:**
   - Go to **App settings** → **Environment variables**
   - Click **Manage variables**

2. **Add Variables:**
   ```
   NEXT_PUBLIC_SITE_URL = https://cooksmartapp.com
   NEXT_PUBLIC_API_URL = https://api.cooksmartapp.com
   RESEND_API_KEY = (your Resend key - or use SES)
   
   # If using AWS SES instead of Resend:
   AWS_REGION = us-east-1 (your region)
   AWS_ACCESS_KEY_ID = (your key)
   AWS_SECRET_ACCESS_KEY = (your secret)
   
   # Database (if using RDS)
   DATABASE_URL = (your RDS connection string)
   ```

3. **Save and Redeploy**
   - Click **Save**
   - Go to **Deployments**
   - Click **Redeploy this version**

### Step 3: Configure Custom Domain (10 minutes)

1. **In Amplify Console:**
   - Go to **App settings** → **Domain management**
   - Click **Add domain**

2. **Add Your Domain:**
   - Domain: `cooksmartapp.com`
   - Click **Configure domain**

3. **Configure Subdomains:**
   - `cooksmartapp.com` → Main site
   - `www.cooksmartapp.com` → Redirect to main
   - Click **Save**

4. **Update Route 53:**
   - Amplify will show you DNS records
   - Go to **Route 53** → **Hosted zones** → `cooksmartapp.com`
   - Add the CNAME records shown by Amplify
   - Wait 5-30 minutes for DNS propagation

5. **SSL Certificate:**
   - Amplify automatically provisions SSL certificate
   - Wait for "Available" status

### Step 4: Configure AWS SES for Email (15 minutes)

**Option A: Use Resend (Easier)**
- Already configured in environment variables
- Skip to Step 5

**Option B: Use AWS SES (More integrated)**

1. **Verify Domain in SES:**
   - Go to **SES Console** → **Verified identities**
   - Click **Create identity**
   - Identity type: **Domain**
   - Domain: `cooksmartapp.com`
   - Click **Create identity**

2. **Add DNS Records:**
   - SES will show DKIM records
   - Add to Route 53:
     - 3 CNAME records for DKIM
     - 1 TXT record for SPF
   - Wait for verification (5-30 minutes)

3. **Request Production Access:**
   - By default, SES is in sandbox mode
   - Go to **Account dashboard**
   - Click **Request production access**
   - Fill out form (usually approved in 24 hours)

4. **Update Email Code:**
   
   Create `website/lib/email-ses.ts`:
   ```typescript
   import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
   
   const ses = new SESClient({
     region: process.env.AWS_REGION || 'us-east-1',
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });
   
   export async function sendEmailSES(options: {
     to: string;
     subject: string;
     html: string;
     text?: string;
   }) {
     const command = new SendEmailCommand({
       Source: 'services.cooksmart@gmail.com',
       Destination: { ToAddresses: [options.to] },
       Message: {
         Subject: { Data: options.subject },
         Body: {
           Html: { Data: options.html },
           Text: { Data: options.text || '' },
         },
       },
     });
     
     await ses.send(command);
   }
   ```

### Step 5: Verify Deployment (10 minutes)

1. **Check Amplify Deployment:**
   - Go to **Deployments** tab
   - Verify "Deploy succeeded"
   - Click on deployment URL

2. **Test Website:**
   - Visit `https://cooksmartapp.com`
   - Check all pages load
   - Test forms
   - Verify legal pages

3. **Test Email:**
   - Subscribe to newsletter
   - Check email arrives
   - Test unsubscribe

---

## Option 2: AWS S3 + CloudFront (More Control)

### When to Use This:
- You want more control over caching
- You need custom CloudFront behaviors
- You're already using CloudFront

### Step 1: Build Static Export (10 minutes)

1. **Update next.config.ts:**
   ```typescript
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   };
   ```

2. **Build:**
   ```bash
   cd website
   npm run build
   ```

3. **Output:**
   - Static files in `website/out/`

### Step 2: Create S3 Bucket (5 minutes)

1. **Go to S3 Console:**
   - https://console.aws.amazon.com/s3/

2. **Create Bucket:**
   - Name: `cooksmartapp-website`
   - Region: Same as your other resources
   - Uncheck "Block all public access"
   - Click **Create bucket**

3. **Enable Static Website Hosting:**
   - Go to bucket → **Properties**
   - Scroll to **Static website hosting**
   - Enable it
   - Index document: `index.html`
   - Error document: `404.html`
   - Save

4. **Set Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::cooksmartapp-website/*"
       }
     ]
   }
   ```

### Step 3: Create CloudFront Distribution (10 minutes)

1. **Go to CloudFront Console:**
   - https://console.aws.amazon.com/cloudfront/

2. **Create Distribution:**
   - Origin domain: Select your S3 bucket
   - Origin access: **Public**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD, OPTIONS**
   - Cache policy: **CachingOptimized**
   - Alternate domain names: `cooksmartapp.com`, `www.cooksmartapp.com`
   - SSL certificate: **Request certificate** (or use existing)
   - Click **Create distribution**

3. **Wait for Deployment:**
   - Takes 10-15 minutes
   - Status will change to "Deployed"

### Step 4: Upload Files (5 minutes)

**Option A: AWS CLI**
```bash
cd website
aws s3 sync out/ s3://cooksmartapp-website/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Option B: AWS Console**
- Go to S3 bucket
- Click **Upload**
- Drag `website/out/` contents
- Click **Upload**

### Step 5: Configure Route 53 (5 minutes)

1. **Go to Route 53:**
   - Select hosted zone: `cooksmartapp.com`

2. **Create A Record:**
   - Name: `cooksmartapp.com`
   - Type: **A - IPv4 address**
   - Alias: **Yes**
   - Alias target: Your CloudFront distribution
   - Click **Create**

3. **Create WWW Record:**
   - Name: `www.cooksmartapp.com`
   - Type: **CNAME**
   - Value: `cooksmartapp.com`
   - Click **Create**

---

## Database Setup (If Needed)

### Connect to Existing RDS

1. **Get Connection String:**
   - Go to **RDS Console**
   - Select your database
   - Copy endpoint

2. **Format Connection String:**
   ```
   postgresql://username:password@endpoint:5432/database
   ```

3. **Add to Environment Variables:**
   - In Amplify: Add `DATABASE_URL`
   - Or in `.env.production`

4. **Install Prisma (if using):**
   ```bash
   cd website
   npm install @prisma/client
   npm install -D prisma
   ```

5. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```

6. **Create Schema:**
   Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     name      String?
     createdAt DateTime @default(now())
   }
   
   model EmailSubscription {
     id        String   @id @default(cuid())
     email     String   @unique
     preferences Json
     createdAt DateTime @default(now())
   }
   ```

7. **Push Schema:**
   ```bash
   npx prisma db push
   ```

---

## Cost Estimate (Using AWS)

### AWS Amplify
- **Build minutes:** $0.01/minute (1,000 free/month)
- **Hosting:** $0.15/GB served (15 GB free/month)
- **Estimated:** $0-5/month for low traffic

### AWS S3 + CloudFront
- **S3 Storage:** $0.023/GB (5 GB free first year)
- **CloudFront:** $0.085/GB (1 TB free first year)
- **Estimated:** $0-3/month for low traffic

### AWS SES
- **Emails:** $0.10/1,000 emails (62,000 free/month)
- **Estimated:** $0/month for low traffic

### AWS RDS (Existing)
- Already paying for this
- No additional cost

**Total Additional Cost:** $0-10/month

---

## Deployment Checklist

### Pre-Deployment ✅
- [x] Code pushed to GitHub
- [x] Build succeeds locally
- [x] Environment variables documented

### AWS Amplify Deployment ✅
- [ ] Amplify app created
- [ ] GitHub connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active

### Email Configuration ✅
- [ ] SES domain verified (or Resend configured)
- [ ] DNS records added
- [ ] Production access requested (SES)
- [ ] Test email sent successfully

### Database Configuration ✅
- [ ] RDS connection string obtained
- [ ] Environment variable set
- [ ] Prisma schema created (if using)
- [ ] Database schema pushed

### Verification ✅
- [ ] Website loads at cooksmartapp.com
- [ ] All pages accessible
- [ ] Forms work
- [ ] Emails send
- [ ] Legal pages load
- [ ] Cookie banner works
- [ ] SSL certificate valid

---

## Continuous Deployment

### Automatic Deployments

**AWS Amplify automatically deploys when you push to GitHub:**

```bash
# Make changes
git add .
git commit -m "Update website"
git push origin fresh-project-migration

# Amplify automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Takes 5-10 minutes
```

### Manual Deployment

**If using S3 + CloudFront:**

Create `deploy.sh`:
```bash
#!/bin/bash
cd website
npm run build
aws s3 sync out/ s3://cooksmartapp-website/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
echo "Deployment complete!"
```

Run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Monitoring

### AWS CloudWatch

1. **Set Up Alarms:**
   - Go to **CloudWatch** → **Alarms**
   - Create alarm for:
     - High error rate
     - High latency
     - Low availability

2. **View Logs:**
   - Amplify: **Monitoring** tab
   - CloudFront: **Monitoring** tab
   - Lambda: **CloudWatch Logs**

### AWS Cost Explorer

1. **Monitor Costs:**
   - Go to **Cost Explorer**
   - View by service
   - Set budget alerts

---

## Troubleshooting

### Build Fails in Amplify

**Check:**
1. Build logs in Amplify console
2. Verify `website` directory is set as base
3. Check environment variables
4. Verify Node.js version

**Fix:**
- Update build settings
- Add missing environment variables
- Check package.json scripts

### Domain Not Working

**Check:**
1. DNS propagation (can take 24-48 hours)
2. Route 53 records are correct
3. SSL certificate is issued
4. CloudFront distribution is deployed

**Fix:**
- Wait for DNS propagation
- Verify CNAME records
- Check certificate status

### Emails Not Sending

**Check:**
1. SES is out of sandbox mode
2. Domain is verified
3. Environment variables are set
4. IAM permissions are correct

**Fix:**
- Request production access
- Verify domain in SES
- Check AWS credentials

---

## Next Steps

### After Deployment

1. **Test Everything:**
   - All pages load
   - Forms submit
   - Emails send
   - Legal pages work

2. **Set Up Monitoring:**
   - CloudWatch alarms
   - Cost alerts
   - Error tracking

3. **Configure Backups:**
   - RDS automated backups
   - S3 versioning (if using)

4. **Security:**
   - Review IAM permissions
   - Enable AWS WAF (optional)
   - Set up CloudTrail

---

## Support

### AWS Support
- **Documentation:** https://docs.aws.amazon.com/
- **Support Center:** https://console.aws.amazon.com/support/
- **Forums:** https://forums.aws.amazon.com/

### Amplify Support
- **Docs:** https://docs.amplify.aws/
- **Discord:** https://discord.gg/amplify

---

**Last Updated:** November 30, 2025  
**Deployment Time:** 45-90 minutes  
**Monthly Cost:** $0-10 (using existing AWS)  
**Recommended:** AWS Amplify for easiest deployment
