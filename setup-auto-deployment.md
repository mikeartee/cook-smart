# Setup Auto-Deployment for Backend

## What We Just Created

✅ **GitHub Actions Workflow**: `.github/workflows/deploy-backend.yml`
- Auto-deploys backend when you push to `fresh-project-migration` branch
- Only triggers when `backend/` files change
- Eliminates SSH deployment loops forever

## Required Setup (One-Time Only)

### Step 1: Add SSH Private Key to GitHub Secrets

1. **Go to GitHub Repository**:
   - Navigate to: https://github.com/tootallgames2020/cook-smart
   - Click **Settings** tab
   - Click **Secrets and variables** → **Actions**

2. **Add New Secret**:
   - Click **New repository secret**
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the contents of your SSH private key file

3. **Get SSH Private Key**:
   ```bash
   # On Windows (if using WSL or Git Bash)
   cat ~/.ssh/cook-smart-key.pem
   
   # Or if the key is elsewhere
   cat /path/to/your/cook-smart-key.pem
   ```

4. **Copy the entire key** (including `-----BEGIN` and `-----END` lines)

### Step 2: Test the Auto-Deployment

Once the secret is configured:

1. **Make any change to backend code**:
   ```bash
   # Example: Add a comment to any backend file
   echo "// Auto-deployment test" >> backend/src/server.ts
   ```

2. **Commit and push**:
   ```bash
   git add backend/src/server.ts
   git commit -m "Test auto-deployment"
   git push origin fresh-project-migration
   ```

3. **Watch GitHub Actions**:
   - Go to: https://github.com/tootallgames2020/cook-smart/actions
   - You should see "Auto-Deploy Backend" workflow running
   - It will SSH into your server and deploy automatically

## How It Works

### Triggers
- ✅ Push to `fresh-project-migration` branch
- ✅ Changes in `backend/` directory
- ✅ Changes to the workflow file itself

### Deployment Process
1. **SSH into server**: `ubuntu@34.203.8.150`
2. **Navigate to backend**: `/home/ubuntu/cook-smart/backend/backend`
3. **Pull latest code**: `git pull origin fresh-project-migration`
4. **Install dependencies**: Only if `package.json` changed
5. **Restart service**: `pm2 restart cook-smart-backend`
6. **Verify deployment**: Health check + logs
7. **Report status**: Success/failure notification

### Benefits
- 🚫 **No more SSH loops**: Never get stuck on deployment again
- ⚡ **Instant deployment**: Push code → Auto-deploy in 2-3 minutes
- 🔍 **Built-in verification**: Health checks ensure deployment worked
- 📋 **Detailed logs**: See exactly what happened during deployment
- 🎯 **Smart triggers**: Only deploys when backend code actually changes

## Current Status

❌ **Needs SSH Key**: Add `SSH_PRIVATE_KEY` secret to GitHub
✅ **Workflow Ready**: Auto-deployment code is live
✅ **Backend Fix Ready**: Recipe matching fix is committed and ready to deploy

## Next Steps

1. **Add SSH secret** (see Step 1 above)
2. **Test deployment** (see Step 2 above)
3. **Verify recipe matching fix** works after auto-deployment

## Emergency Fallback

If auto-deployment fails, you can still use manual SSH:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd /home/ubuntu/cook-smart/backend/backend
git pull origin fresh-project-migration
pm2 restart cook-smart-backend
```

But with auto-deployment, you should never need this again!

---

**Once configured, every backend fix will deploy automatically. No more SSH loops!**