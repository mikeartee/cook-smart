# Setup Custom Domain for Cook Smart Website

**Goal**: Use `cooksmartapp.com` instead of the default Amplify URL  
**Time**: 5-10 minutes  
**Cost**: $0 (FREE)

---

## Step 1: Open AWS Amplify Console

1. Go to: https://console.aws.amazon.com/amplify/
2. **Region**: Make sure you're in `us-east-1` (top right)
3. Click on your **Cook Smart** app (should see it in the list)

---

## Step 2: Add Custom Domain

1. In the left sidebar, click **"Domain management"**
2. Click the **"Add domain"** button
3. You'll see a dropdown with your Route 53 domains
4. Select **"cooksmartapp.com"** from the dropdown
5. Click **"Configure domain"**

---

## Step 3: Configure Subdomains

Amplify will show a configuration screen:

```
Root domain: cooksmartapp.com
├── cooksmartapp.com → main (your app branch)
└── www.cooksmartapp.com → Redirect to cooksmartapp.com
```

**Action**: Click **"Save"** (accept the defaults)

---

## Step 4: Automatic Route 53 Setup

Amplify will ask:

> "Do you want Amplify to automatically create the required DNS records in Route 53?"

**Action**: Click **"Yes, update DNS records"** ✅

This will:
- ✅ Add CNAME records to Route 53
- ✅ Add A/AAAA records for root domain
- ✅ Configure SSL certificate
- ✅ Set up redirects

---

## Step 5: Wait for SSL Certificate

You'll see status indicators:

1. **DNS Configuration**: ~2-5 minutes ⏳
2. **SSL Certificate**: ~5-30 minutes ⏳
3. **Domain Active**: ✅ Ready!

**What to do**: Just wait. Refresh the page every few minutes to check status.

---

## Step 6: Verify It Works

Once status shows **"Available"**:

1. Open browser
2. Go to: `https://cooksmartapp.com`
3. Should see your Cook Smart website! 🎉

Also test:
- `https://www.cooksmartapp.com` (should redirect to main)
- `http://cooksmartapp.com` (should redirect to HTTPS)

---

## Troubleshooting

### "Domain verification pending"
- **Wait**: SSL verification can take up to 30 minutes
- **Check**: Make sure you clicked "Yes" to update Route 53

### "DNS configuration failed"
- **Check**: Verify you have a Route 53 hosted zone for cooksmartapp.com
- **Fix**: Go to Route 53 console and verify the hosted zone exists

### "Certificate validation timeout"
- **Wait**: Sometimes takes longer, give it 1 hour
- **Check**: Route 53 records were added correctly

---

## What You Get

✅ **Professional URL**: `https://cooksmartapp.com`  
✅ **FREE SSL Certificate**: Automatic HTTPS  
✅ **Auto-renewal**: SSL renews automatically  
✅ **WWW Redirect**: www.cooksmartapp.com → cooksmartapp.com  
✅ **Fast CDN**: CloudFront distribution  
✅ **No Extra Cost**: $0/month

---

## After Setup

### Update Environment Variables

If you have any environment variables with the old URL, update them:

```env
NEXT_PUBLIC_SITE_URL=https://cooksmartapp.com
```

### Update App Store Links

When you submit to app stores, use:
- **Website**: https://cooksmartapp.com
- **Privacy Policy**: https://cooksmartapp.com/legal/privacy
- **Terms**: https://cooksmartapp.com/legal/terms

### Update Social Media

Update any social media profiles with the new URL.

---

## Need Help?

If you get stuck:
1. Check the Amplify console for error messages
2. Verify Route 53 hosted zone exists
3. Wait longer (SSL can take 30+ minutes sometimes)
4. Contact AWS Support (they're very helpful with Amplify)

---

**Ready to go!** Just follow the steps above in your AWS console.
