# Fresh React Native Project Migration Guide
## Option B: New Branch Strategy

### Phase 1: Create Fresh Project (Outside Current Repo)

**Step 1: Navigate to parent directory**
```bash
cd ..
```

**Step 2: Create fresh React Native project**
```bash
npx @react-native-community/cli@latest init CookSmartNew
```
This will take 3-5 minutes. It creates a brand new React Native project with:
- Properly configured Android folder
- Correct Kotlin versions
- All native dependencies aligned
- Working build environment

---

### Phase 2: Copy Your Code to New Project

**Step 3: Copy application code**
```bash
# Copy source code
xcopy CookSmart\src CookSmartNew\src\ /E /I /Y

# Copy backend
xcopy CookSmart\backend CookSmartNew\backend\ /E /I /Y

# Copy assets
xcopy CookSmart\assets CookSmartNew\assets\ /E /I /Y

# Copy .kiro folder (documentation)
xcopy CookSmart\.kiro CookSmartNew\.kiro\ /E /I /Y
```

**Step 4: Merge package.json dependencies**
- Open `CookSmart/package.json`
- Open `CookSmartNew/package.json`
- Copy your custom dependencies from old to new (I'll help with this)
- Keep the React Native version from the NEW project

**Step 5: Copy configuration files**
```bash
# Copy environment files
copy CookSmart\.env CookSmartNew\.env
copy CookSmart\.env.example CookSmartNew\.env.example

# Copy TypeScript config
copy CookSmart\tsconfig.json CookSmartNew\tsconfig.json

# Copy ESLint config
copy CookSmart\.eslintrc.js CookSmartNew\.eslintrc.js
```

---

### Phase 3: Install Dependencies & Test

**Step 6: Install dependencies**
```bash
cd CookSmartNew
npm install
```

**Step 7: Test Android build**
```bash
npm run android
```

**Expected Result:** App builds and runs successfully on Android emulator/device

---

### Phase 4: Update Git (Once Confirmed Working)

**Step 8: Create new branch in original repo**
```bash
cd ..\CookSmart
git checkout -b fresh-project-migration
```

**Step 9: Clear current directory (except .git)**
```bash
# Remove everything except .git folder
# We'll do this carefully to preserve Git history
```

**Step 10: Copy working project files**
```bash
# Copy all files from CookSmartNew to CookSmart
xcopy ..\CookSmartNew\* . /E /I /Y /EXCLUDE:.git
```

**Step 11: Commit the migration**
```bash
git add .
git commit -m "Migrate to fresh React Native project - Fixed Android build environment"
git push -u origin fresh-project-migration
```

**Step 12: Test again in the repo**
```bash
npm install
npm run android
```

**Step 13: Merge to main (once confirmed)**
```bash
git checkout main
git merge fresh-project-migration
git push
```

---

## Current Status: Ready to Start

**Next Action:** Run the command to create the fresh project:
```bash
cd ..
npx @react-native-community/cli@latest init CookSmartNew
```

---

## Backup Safety

Your current project is safe because:
- ✅ All changes are committed to Git
- ✅ Working on a new branch
- ✅ Can rollback anytime with `git checkout main`
- ✅ Fresh project created outside current repo first

---

## Time Estimate

- Create fresh project: 5 min
- Copy code: 10 min
- Install dependencies: 5 min
- Test build: 2 min
- Git operations: 3 min

**Total: ~25 minutes**

---

## What Gets Preserved

✅ All your code (src/)
✅ All your backend (backend/)
✅ All your features
✅ All your documentation (.kiro/)
✅ All your assets
✅ Git history
✅ Environment configs

## What Gets Fixed

✅ Android build environment
✅ Kotlin version conflicts
✅ Gradle configuration
✅ Native dependencies
✅ Library compatibility

---

**Ready to start? Run the first command!**
