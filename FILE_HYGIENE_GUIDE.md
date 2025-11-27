# File Hygiene Guide

## Keep Your Repository Clean

This guide helps maintain a clean, professional repository by preventing accumulation of temporary files, test scripts, and outdated documentation.

## Quick Rules

### ✅ DO

- Delete test files immediately after use
- Remove deployment scripts after successful deployment
- Update existing documentation instead of creating new files
- Keep only the latest APK file
- Use CHANGELOG.md for recording completed work
- Review and clean up weekly (every Friday)

### ❌ DON'T

- Commit files with `test-`, `temp-`, `debug-` prefixes
- Keep backup files (`.backup`, `.old`, `.tmp`)
- Accumulate multiple APK files
- Create multiple status documents for the same feature
- Leave WIP or DRAFT files in the repository

## File Naming Conventions

Use these prefixes to identify temporary files:

- `temp-` - Temporary work files (delete before commit)
- `test-` - Test scripts (delete after testing)
- `debug-` - Debug files (delete after debugging)
- `WIP-` - Work in progress (remove prefix when done)
- `DRAFT-` - Draft documents (remove prefix when finalized)

## Weekly Cleanup Checklist

Every Friday, spend 5 minutes:

1. ✅ Check root directory for cleanup candidates
2. ✅ Delete any `test-*`, `temp-*`, `debug-*` files
3. ✅ Remove old deployment scripts
4. ✅ Delete old APK files (keep latest only)
5. ✅ Archive or consolidate old documentation
6. ✅ Review and update CHANGELOG.md

## Before Every Commit

Run this mental checklist:

1. ✅ Run `git status` and review all staged files
2. ✅ Delete any temporary or test files
3. ✅ Ensure no debug/backup files are staged
4. ✅ Verify only production-ready files are committed

## Automated Checks

The pre-commit hook will warn you about:

- Test files in root directory (`test-*.js`)
- Temporary files (`temp-*`)
- Backup files (`.backup`, `.old`, `.tmp`)
- WIP/Draft files (`WIP-`, `DRAFT-`)
- Multiple APK files
- Excessive old release notes

## Documentation Best Practices

### Instead of Creating New Files

❌ **Don't do this:**
```
FEATURE_PLAN.md
FEATURE_STATUS.md
FEATURE_IMPLEMENTATION.md
FEATURE_TESTING.md
FEATURE_COMPLETE.md
```

✅ **Do this:**
```
Update CHANGELOG.md with feature progress
Keep one FEATURE.md that gets updated
Delete setup docs after feature is complete
```

### Use CHANGELOG.md

Record these in CHANGELOG instead of separate files:

- Deployment completions
- Feature implementations
- Bug fixes
- Configuration changes
- Version releases

### Keep Only Latest

- Release notes: Keep latest 2-3 versions
- APK files: Keep only current release
- Deployment scripts: Delete after successful deployment
- Setup guides: Delete after setup is complete

## Root Directory Rules

Your root directory should only contain:

### Essential Files

- `README.md` - Project overview
- `CHANGELOG.md` - Change history
- `LICENSE` - License information
- `TODO.md` - Current tasks
- Configuration files (`.eslintrc.js`, `babel.config.js`, etc.)

### Legal/Policy Documents

- `PRIVACY_POLICY.md`
- `TERMS_OF_SERVICE.md`
- `EULA.md`
- Other legal documents

### Build Scripts

- `build-apk.bat`
- `run-android.bat`
- Essential build/run scripts only

### What Doesn't Belong in Root

- ❌ Test files
- ❌ Temporary files
- ❌ Debug files
- ❌ Old APK files
- ❌ Multiple status documents
- ❌ Deployment scripts (after deployment)
- ❌ Setup guides (after setup)

## Examples

### Good Commit

```
✅ Clean commit - only production files
- src/components/NewFeature.tsx
- CHANGELOG.md (updated with feature info)
- README.md (updated documentation)
```

### Bad Commit (Will Trigger Warnings)

```
⚠️  Needs cleanup before commit
- test-new-feature.js (delete after testing)
- temp-debug-output.json (delete)
- NewFeature.tsx.backup (delete)
- WIP-feature-plan.md (finalize or delete)
- CookSmart-v1.0.20.apk (old version, delete)
```

## When in Doubt

Ask yourself:

1. **Is this file temporary?** → Delete it
2. **Is this a test file?** → Delete it after testing
3. **Is this a backup?** → Delete it
4. **Is this outdated?** → Delete or archive it
5. **Can I update an existing file instead?** → Do that

## Benefits of Clean Repository

- ✅ Easier to find important files
- ✅ Faster git operations
- ✅ Professional appearance
- ✅ Reduced confusion for team members
- ✅ Smaller repository size
- ✅ Better code reviews
- ✅ Clear project structure

## Remember

**A clean repository is a professional repository. Delete as you go.**

