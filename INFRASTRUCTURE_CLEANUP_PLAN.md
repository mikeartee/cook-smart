# Infrastructure Cleanup Plan - CRITICAL

## Current State: DISASTER
- **80+ markdown files** in root directory
- **Multiple duplicated** backend structures  
- **Scattered configuration** files
- **Outdated documentation** everywhere
- **Test files mixed** with production code

## Cleanup Strategy

### Phase 1: Root Directory Cleanup (IMMEDIATE)
1. **Delete outdated session files** (SESSION_*, TESTING_*, etc.)
2. **Consolidate release notes** (keep only latest)
3. **Remove duplicate status files** 
4. **Move documentation** to `/docs` folder
5. **Clean up test files** and temporary scripts

### Phase 2: Backend Structure Fix
1. **Verify single backend** location
2. **Remove duplicate** migration scripts
3. **Clean up test files** in backend
4. **Organize configuration** properly

### Phase 3: Git Repository Cleanup
1. **Remove large files** from history if needed
2. **Clean up branches** 
3. **Verify .gitignore** is comprehensive

### Phase 4: Production Verification
1. **Test all endpoints** after cleanup
2. **Verify deployment** still works
3. **Check website** deployment
4. **Validate mobile app** build

## Files to DELETE (Root Directory)
- All SESSION_* files (7 files)
- All TESTING_* files (3 files) 
- Duplicate FATSECRET_* files (keep only latest)
- Old RELEASE_NOTES_* files (keep only current)
- Temporary .html files
- Old .bat/.sh scripts not in use
- Duplicate status files

## Files to MOVE to /docs
- All feature documentation
- Setup guides
- Deployment guides
- Legal/compliance docs

## Files to KEEP in Root
- README.md
- CHANGELOG.md
- LICENSE
- package.json
- Configuration files (.eslintrc, etc.)
- App.tsx
- Essential build files

## Backend Cleanup
- Remove duplicate migration scripts
- Clean up test files
- Organize into proper folders
- Verify single source of truth

## Expected Result
- **Clean root directory** (< 20 files)
- **Organized documentation** in /docs
- **Single backend structure**
- **Clear project structure**
- **Working deployment pipeline**

## Risk Assessment
- **LOW RISK**: Deleting documentation files
- **MEDIUM RISK**: Moving configuration files  
- **HIGH RISK**: Touching backend structure

## Execution Order
1. Backup current state
2. Delete unnecessary files
3. Move documentation
4. Test deployment
5. Verify all systems working