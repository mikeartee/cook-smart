# PRODUCTION ONLY - Cook Smart

## ⚠️ CRITICAL: We Are LIVE

**Everything is in production. No local testing. No test servers.**

- **Website**: https://cooksmartapp.com (LIVE)
- **API**: https://api.cooksmartapp.com (LIVE)
- **App**: Live on Firebase App Distribution (LIVE)
- **Production Server**: 34.203.8.150

---

## Working with Production

### When Making Changes:

1. **Edit code locally** (this repo)
2. **Deploy directly to production** (34.203.8.150)
3. **Test on live website/app**

### NO Local Testing
- ❌ Don't run `npm start` locally
- ❌ Don't test on localhost
- ❌ Don't create test files
- ✅ Deploy to production
- ✅ Test on live site

---

## Quick Deploy to Production

### Deploy Backend Changes:

```bash
# 1. Copy files to production
scp -i ~/.ssh/cook-smart-key.pem backend/src/[file] ubuntu@34.203.8.150:/home/ubuntu/cook-smart/backend/backend/src/[file]

# 2. Rebuild and restart
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd /home/ubuntu/cook-smart/backend/backend
npm run build
pm2 restart cook-smart-backend
exit
```

### Check Production Status:

```bash
# Health check
curl https://api.cooksmartapp.com/health

# PM2 status
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 status"

# View logs
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 logs cook-smart-backend --lines 50"
```

---

## Production Endpoints

### Live API:
- Health: https://api.cooksmartapp.com/health
- Contact: https://api.cooksmartapp.com/contact
- Auth: https://api.cooksmartapp.com/api/v1/auth/login
- Recipes: https://api.cooksmartapp.com/api/v1/recipes

### Live Website:
- Home: https://cooksmartapp.com
- Contact: https://cooksmartapp.com/contact
- Admin: https://cooksmartapp.com/admin/login

---

## Production Server Access

```bash
# SSH into production
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150

# Backend location
cd /home/ubuntu/cook-smart/backend/backend

# Check PM2
pm2 status
pm2 logs cook-smart-backend
pm2 restart cook-smart-backend
```

---

## When Something Breaks

1. **Check production logs**:
   ```bash
   ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 logs cook-smart-backend --lines 100"
   ```

2. **Fix code locally**

3. **Deploy fix to production**:
   ```bash
   scp -i ~/.ssh/cook-smart-key.pem [file] ubuntu@34.203.8.150:/home/ubuntu/cook-smart/backend/backend/[path]
   ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && npm run build && pm2 restart cook-smart-backend"
   ```

4. **Verify on live site**

---

## Remember

- 🔴 **EVERYTHING IS LIVE**
- 🔴 **NO LOCAL TESTING**
- 🔴 **DEPLOY DIRECTLY TO PRODUCTION**
- 🔴 **TEST ON LIVE WEBSITE/APP**

---

## Production Credentials

All credentials are in:
- `backend/.env` (local copy for deployment)
- `/home/ubuntu/cook-smart/backend/backend/.env` (production)

Never commit `.env` files to Git.

---

## Current Production Status

✅ Backend running on 34.203.8.150
✅ Website live at cooksmartapp.com
✅ API live at api.cooksmartapp.com
✅ Contact form working
✅ FatSecret integrated
✅ All services operational
