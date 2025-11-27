# Cleanup & Organization Plan

## 🎯 Goal
One clean structure, no confusion, everything in the right place.

## 📊 Current Mess

### Local Computer Issues:
- Multiple documentation files (50+ MD files in root)
- Deployment scripts scattered everywhere
- No clear separation of docs vs code
- Git tracking too many files

### Server Issues:
- Two `cook-smart-backend` directories
- SQL files scattered in home directory
- No git repository on server
- Manual file uploads instead of git deploys

### Secrets Issues:
- `.env` files in git (BAD!)
- Keys scattered across files
- No centralized secret management

---

## ✅ PROPOSED STRUCTURE

### Local Computer:
```
cook-smart/
├── .git/                          # Git repository
├── .github/                       # GitHub workflows
├── .env.example                   # Template (NO SECRETS)
├── .gitignore                     # Ignore secrets
├── README.md                      # Main readme
├── package.json                   # Root package
│
├── backend/                       # Backend code
│   ├── src/                       # Source code
│   ├── migrations/                # Database migrations
│   ├── .env                       # LOCAL ONLY (gitignored)
│   ├── .env.production.example    # Template for production
│   └── package.json
│
├── src/                           # Frontend React Native
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── ...
│
├── android/                       # Android build
│
├── docs/                          # ALL DOCUMENTATION HERE
│   ├── deployment/
│   │   ├── DEPLOY_GUIDE.md
│   │   ├── PAYMENT_DEPLOYMENT.md
│   │   └── SPOONACULAR_DEPLOYMENT.md
│   ├── features/
│   │   ├── ACHIEVEMENTS.md
│   │   ├── NOTIFICATIONS.md
│   │   └── RECIPES.md
│   ├── guides/
│   │   ├── PRODUCT_HUNT.md
│   │   ├── QUICK_WINS.md
│   │   └── USER_APPEAL.md
│   └── legal/
│       ├── TERMS_OF_SERVICE.md
│       ├── PRIVACY_POLICY.md
│       └── REFUND_POLICY.md
│
├── scripts/                       # Deployment scripts
│   ├── deploy-backend.sh
│   ├── deploy-notifications.sh
│   └── run-migration.sh
│
└── secrets/                       # LOCAL ONLY (gitignored)
    ├── .env.production            # Production secrets
    ├── cook-smart-key.pem         # SSH key
    └── stripe-keys.txt            # Stripe keys
```

### Server Structure:
```
/home/ubuntu/
├── cook-smart/                    # ONLY THIS ONE
│   ├── backend/                   # Git clone of your repo
│   │   ├── src/
│   │   ├── dist/                  # Built files
│   │   ├── .env                   # Production secrets
│   │   └── node_modules/
│   └── logs/                      # Application logs
│
└── .ssh/                          # SSH keys
    └── authorized_keys
```

---

## 🧹 CLEANUP STEPS

### Step 1: Local Cleanup (30 minutes)

**A. Create docs directory and move files:**
```bash
mkdir docs
mkdir docs/deployment
mkdir docs/features
mkdir docs/guides
mkdir docs/legal

# Move deployment docs
move DEPLOY_*.md docs/deployment/
move SPOONACULAR_*.md docs/deployment/
move PAYMENT_*.md docs/deployment/
move DEPLOYMENT_*.md docs/deployment/

# Move feature docs
move NOTIFICATIONS_*.md docs/features/
move RECIPE_*.md docs/features/
move STRIPE_*.md docs/features/

# Move guides
move PRODUCT_HUNT_*.md docs/guides/
move QUICK_WINS_*.md docs/guides/
move USER_APPEAL_*.md docs/guides/

# Move legal
move TERMS_OF_SERVICE.md docs/legal/
move PRIVACY_POLICY.md docs/legal/
move REFUND_POLICY.md docs/legal/
move COOKIE_POLICY.md docs/legal/
move ACCEPTABLE_USE_POLICY.md docs/legal/
```

**B. Create scripts directory:**
```bash
mkdir scripts
move *.bat scripts/
move *.ps1 scripts/
move *.sh scripts/
```

**C. Create secrets directory (gitignored):**
```bash
mkdir secrets
copy backend\.env secrets\.env.production
copy .ssh\cook-smart-key.pem secrets\
```

**D. Update .gitignore:**
```
# Secrets
secrets/
*.pem
.env
.env.local
.env.production

# Build
dist/
build/
node_modules/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db
```

**E. Remove from git (but keep locally):**
```bash
git rm --cached backend/.env
git rm --cached .env
git commit -m "chore: Remove secrets from git"
```

### Step 2: Server Cleanup (15 minutes)

**A. SSH to server:**
```bash
ssh -i "secrets\cook-smart-key.pem" ubuntu@3.237.38.24
```

**B. Backup current setup:**
```bash
cd /home/ubuntu
tar -czf backup-$(date +%Y%m%d).tar.gz cook-smart-backend/ *.sql *.json
```

**C. Clean up home directory:**
```bash
# Remove old backend directory
rm -rf /home/ubuntu/cook-smart-backend

# Remove scattered SQL files
mkdir old-files
mv *.sql old-files/
mv *.json old-files/
mv backend.zip old-files/
```

**D. Clone fresh from git:**
```bash
cd /home/ubuntu
git clone https://github.com/tootallgames2020/cook-smart.git
cd cook-smart/backend
```

**E. Set up production secrets:**
```bash
# Create .env file (you'll paste secrets)
nano .env
# Paste your production secrets here
```

**F. Install and build:**
```bash
npm install --legacy-peer-deps
npm run build
```

**G. Update PM2:**
```bash
pm2 delete cook-smart-backend
pm2 start dist/server.js --name cook-smart-backend
pm2 save
```

### Step 3: Secrets Management (10 minutes)

**A. Create secrets template:**

File: `backend/.env.example`
```bash
# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=cooksmartdb
DB_USER=your-username
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-jwt-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# Support
SUPPORT_EMAIL=services.cooksmart@gmail.com
```

**B. Store actual secrets locally:**

File: `secrets/.env.production` (gitignored)
```bash
# Copy your actual production values here
# This file is NEVER committed to git
```

**C. Document where secrets are:**

File: `secrets/README.md`
```markdown
# Secrets Location Guide

## Local Development
- File: `backend/.env`
- Contains: Local database, test Stripe keys

## Production Server
- Location: `/home/ubuntu/cook-smart/backend/.env`
- Contains: Production database, live Stripe keys

## SSH Key
- Local: `secrets/cook-smart-key.pem`
- Permissions: chmod 400

## Stripe Dashboard
- Live keys: https://dashboard.stripe.com/apikeys
- Webhook secret: https://dashboard.stripe.com/webhooks

## AWS Secrets Manager (Future)
- Consider moving to AWS Secrets Manager
- Cost: $0.40/month per secret
```

---

## 🚀 DEPLOYMENT WORKFLOW (After Cleanup)

### New Deployment Process:
```bash
# 1. Local: Make changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# 2. Server: Deploy
ssh -i "secrets/cook-smart-key.pem" ubuntu@3.237.38.24
cd /home/ubuntu/cook-smart/backend
git pull origin main
npm install --legacy-peer-deps
npm run build
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 30
```

### One-Command Deploy:
```bash
# Create: scripts/deploy.sh
ssh -i "secrets/cook-smart-key.pem" ubuntu@3.237.38.24 << 'EOF'
cd /home/ubuntu/cook-smart/backend
git pull origin main
npm install --legacy-peer-deps
npm run build
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 30
EOF
```

---

## 📋 CLEANUP CHECKLIST

### Local Computer:
- [ ] Create `docs/` directory structure
- [ ] Move all MD files to appropriate folders
- [ ] Create `scripts/` directory
- [ ] Move all deployment scripts
- [ ] Create `secrets/` directory (gitignored)
- [ ] Copy secrets to `secrets/`
- [ ] Update `.gitignore`
- [ ] Remove secrets from git
- [ ] Commit cleanup changes

### Server:
- [ ] Backup current setup
- [ ] Remove old `cook-smart-backend` directory
- [ ] Clean up scattered SQL files
- [ ] Clone fresh from git
- [ ] Create production `.env`
- [ ] Install dependencies
- [ ] Build project
- [ ] Update PM2 configuration
- [ ] Test deployment

### Documentation:
- [ ] Update README.md with new structure
- [ ] Create secrets/README.md
- [ ] Update deployment guides
- [ ] Document new workflow

---

## 🎯 BENEFITS

### Before Cleanup:
- ❌ 50+ files in root directory
- ❌ Secrets in git
- ❌ Two backend directories on server
- ❌ Manual file uploads
- ❌ Confusion about what's where

### After Cleanup:
- ✅ Clean organized structure
- ✅ Secrets properly managed
- ✅ One source of truth (git)
- ✅ Simple deployment workflow
- ✅ Clear documentation

---

## ⏱️ TIME ESTIMATE

- Local cleanup: 30 minutes
- Server cleanup: 15 minutes
- Testing: 15 minutes
- **Total: 1 hour**

---

## 🚨 SAFETY

### Backup Before Cleanup:
```bash
# Local
git commit -am "backup before cleanup"
git push origin main

# Server
ssh -i "secrets/cook-smart-key.pem" ubuntu@3.237.38.24
cd /home/ubuntu
tar -czf backup-$(date +%Y%m%d).tar.gz cook-smart-backend/
```

### Rollback Plan:
If anything breaks:
```bash
# Server
cd /home/ubuntu
tar -xzf backup-YYYYMMDD.tar.gz
pm2 restart cook-smart-backend
```

---

## 💡 NEXT STEPS

1. **Review this plan** - Make sure you understand it
2. **Backup everything** - Safety first
3. **Run local cleanup** - Organize your computer
4. **Run server cleanup** - Clean server structure
5. **Test deployment** - Make sure it works
6. **Update documentation** - Keep it current

---

**Want me to start the cleanup process?**
