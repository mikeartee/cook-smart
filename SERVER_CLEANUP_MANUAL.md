# Server Cleanup - Manual Steps

## Current Status:
- ✅ Backup created: backup-20251127-081541.tar.gz (59MB)
- ✅ PM2 stopped
- ✅ Old directories cleaned
- ✅ /home/ubuntu/cook-smart directory created
- ⏳ Need to upload code

## Issue:
Git clone requires authentication. Since this is a private repo, we need to either:
1. Make repo public temporarily
2. Upload code manually via SCP
3. Set up SSH keys on server for GitHub

## Recommended: Upload via SCP (Fastest)

### Step 1: Upload Backend Code
```bash
# From your local computer
cd c:\Users\toota\Documents\Projects\cook-smart
scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" -r backend ubuntu@3.237.38.24:/home/ubuntu/cook-smart/
```

### Step 2: Upload Production .env
```bash
scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" secrets\.env.production ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/.env
```

### Step 3: SSH and Complete Setup
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24

# Install and build
cd /home/ubuntu/cook-smart/backend
npm install --legacy-peer-deps
npm run build

# Start with PM2
pm2 start dist/server.js --name cook-smart-backend --cwd /home/ubuntu/cook-smart/backend
pm2 save

# Check logs
pm2 logs cook-smart-backend --lines 30
```

## Alternative: Make Repo Public Temporarily

1. Go to: https://github.com/tootallgames2020/cook-smart/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Make public"
4. Run server cleanup script
5. Change back to private

## Alternative: Set Up GitHub SSH on Server

```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24

# Generate SSH key
ssh-keygen -t ed25519 -C "ubuntu@cook-smart-server"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys
# Then clone with SSH URL
git clone git@github.com:tootallgames2020/cook-smart.git
```

---

## Current Server State:
```
/home/ubuntu/
├── cook-smart/              # Empty directory (ready for code)
├── old-files/               # Moved SQL files
├── backup-20251127-081541.tar.gz  # Backup
└── server-cleanup.sh        # Cleanup script
```

## Target State:
```
/home/ubuntu/
└── cook-smart/
    └── backend/
        ├── src/
        ├── dist/
        ├── .env
        ├── node_modules/
        └── package.json
```

---

**Which method do you prefer?**
1. Upload via SCP (fastest, 5 minutes)
2. Make repo public temporarily (easiest, 3 minutes)
3. Set up SSH keys (most secure, 10 minutes)
