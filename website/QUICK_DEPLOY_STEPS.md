# Quick Deploy Steps - AWS Amplify

**Region:** us-east-1  
**Domain:** cooksmartapp.com  
**Time:** 30 minutes

---

## Step 1: Create Amplify App (Now)

### Go to AWS Console
🔗 https://console.aws.amazon.com/amplify/home?region=us-east-1

### Create App
1. Click **New app** → **Host web app**
2. Select **GitHub**
3. Authorize if needed

### Select Repository
- **Repository:** `tootallgames2020/cook-smart`
- **Branch:** `fresh-project-migration`
- Click **Next**

### Configure Build
**App name:** `cook-smart-website`

**Build settings - Copy/Paste this:**
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
- Click **Edit** next to "Build and test settings"
- Set **Base directory:** `website`

Click **Next** → **Save and deploy**

⏱️ Wait 5-10 minutes for deployment

---

## Step 2: Add Environment Variables (After Deploy)

### In Amplify Console:
**App settings** → **Environment variables** → **Manage variables**

### Add These Variables:

```
NEXT_PUBLIC_SITE_URL
https://cooksmartapp.com

NEXT_PUBLIC_API_URL
https://cooksmartapp.com

AWS_REGION
us-east-1
```

**Save** → Go to **Deployments** → **Redeploy this version**

---

## Step 3: Configure Domain (After Redeploy)

### In Amplify Console:
**App settings** → **Domain management** → **Add domain**

### Add Domain:
- **Domain:** `cooksmartapp.com`
- Click **Configure domain**

### Configure Subdomains:
- ✅ `cooksmartapp.com` → Main
- ✅ `www.cooksmartapp.com` → Redirect to main
- Click **Save**

### Update Route 53:
Amplify will show DNS records to add.

1. Open new tab: https://console.aws.amazon.com/route53/
2. Click **Hosted zones** → `cooksmartapp.com`
3. Add the CNAME records shown by Amplify
4. Wait 5-30 minutes for DNS

---

## Step 4: Configure Email (Optional - Can Do Later)

### Option A: Use Resend (Easiest)
1. Get API key from https://resend.com/api-keys
2. Add to Amplify environment variables:
   ```
   RESEND_API_KEY
   re_your_key_here
   ```

### Option B: Use AWS SES (More Integrated)
1. Go to SES Console: https://console.aws.amazon.com/ses/
2. **Verified identities** → **Create identity**
3. Domain: `cooksmartapp.com`
4. Add DNS records to Route 53
5. Request production access
6. Add to Amplify:
   ```
   AWS_ACCESS_KEY_ID
   your_key
   
   AWS_SECRET_ACCESS_KEY
   your_secret
   ```

---

## Step 5: Verify Everything Works

### Test Website:
- ✅ Visit https://cooksmartapp.com
- ✅ Check all pages load
- ✅ Test forms
- ✅ Verify legal pages

### Test Email (if configured):
- ✅ Subscribe to newsletter
- ✅ Check email arrives
- ✅ Test unsubscribe

---

## Quick Troubleshooting

### Build Fails?
- Check build logs in Amplify console
- Verify base directory is set to `website`
- Check environment variables

### Domain Not Working?
- Wait 30 minutes for DNS propagation
- Verify CNAME records in Route 53
- Check SSL certificate status in Amplify

### Need Help?
- Check full guide: `DEPLOYMENT_GUIDE_AWS.md`
- AWS Amplify docs: https://docs.amplify.aws/

---

## What You'll Get

✅ **Website live at:** https://cooksmartapp.com  
✅ **Automatic SSL certificate**  
✅ **Auto-deploy on git push**  
✅ **45 pages deployed**  
✅ **All legal compliance active**  
✅ **Cost:** ~$0-5/month

---

## After Deployment

### Automatic Updates:
```bash
# Make changes
git add .
git commit -m "Update"
git push

# Amplify auto-deploys in 5-10 minutes
```

### Monitor:
- Amplify Console → **Monitoring** tab
- CloudWatch for logs
- Cost Explorer for billing

---

**Ready? Start with Step 1!**

Let me know when each step completes and I'll help with the next one.
