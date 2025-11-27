# Cook Smart - Project Steering Rules

## Technical Standards

### Code Format & Structure
- **Framework**: React Native (no Expo) for cross-platform compatibility
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL on AWS RDS
- **Styling**: Consistent component-based styling
- **File Structure**: Feature-based organization
- **Error Handling**: Try-catch blocks with proper logging
- **Testing**: Test each feature before moving to next

### Verified Fixes Repository
- Document all successful fixes in `/fixes-log.md`
- Always try verified fixes before attempting new solutions
- Update fix success rate after each use

### AWS Architecture
- **Hosting**: EC2 or ECS with Docker
- **Database**: RDS PostgreSQL
- **Storage**: S3 for images/files
- **Email**: SES for notifications
- **CDN**: CloudFront for performance

### Free/Low-Cost Priority
- Use free tiers and open-source solutions during BETA
- Open Food Facts API (free barcode scanning)
- Multiple recipe APIs with free tiers
- AWS free tier utilization
- **🚨 CRITICAL CONSTRAINT**: User has $20/month emergency budget - use only when truly necessary
- **ALWAYS verify cost implications** before implementing ANY service (AWS, APIs, tools, SaaS)
- **Scale minimally** - only add resources when absolutely needed or user demand requires it
- **Monitor usage** across all services to stay within budget limits
- **Prioritize free/open-source solutions** - paid options only as last resort
- **Cost-benefit analysis required** - paid services must be essential, not just better
- **Budget allocation**: $20/month available for truly necessary services only
- **Upscaling allowed**: Budget can increase when user growth/revenue justifies infrastructure scaling

## Development Rules

### Quality Assurance - ZERO TOLERANCE POLICY
1. **MANDATORY**: Run verification scan after every code change
2. **MANDATORY**: Fix ALL errors before proceeding to next task
3. **MANDATORY**: Test each feature immediately after implementation
4. **MANDATORY**: No moving forward until current feature works and passes verification
5. **MANDATORY**: Check cost implications for EVERY service/tool/API before implementation ($20/month emergency budget - use only when truly necessary)
6. Document any issues and their solutions in fixes-log.md

### ZERO TOLERANCE - What It Means
**ZERO means ZERO. No exceptions. No compromises.**

- ✅ **0 TypeScript errors** - Not 1, not "just warnings", ZERO
- ✅ **0 ESLint errors** - Every single one must be fixed
- ✅ **0 Build failures** - Code must compile successfully
- ✅ **0 Runtime errors** - Code must execute without crashing
- ✅ **0 Unused variables** - Clean code, no dead code
- ✅ **0 Console warnings** - Production-ready means clean console
- ✅ **0 Broken tests** - All tests must pass
- ✅ **0 Security vulnerabilities** - Critical and high severity must be fixed

**Every step becomes production-ready. Every commit is deployable.**

### Verification Process
- Run `auto-verify.bat` or `node .kiro/verify-and-scan.js` after every change
- Must show "ALL CHECKS PASSED" before marking task complete
- Auto-fix available for common issues
- If verification shows ANY errors, stop and fix them immediately
- Never proceed to next task with pending errors
- "It's just a warning" is NOT acceptable - fix it

### User Experience
- Clear BETA labeling throughout app
- "Under Development" markers for incomplete features
- Responsive design for mobile-first approach
- Intuitive navigation and user flow

### Security Standards

- Secure authentication and session management
- Input validation and sanitization
- Proper error handling without exposing system details
- Secure API key management

### File Hygiene - Keep Repository Clean

**Principle: Delete as you go. Clean code, clean repository.**

#### Immediate Deletion (Do Not Commit)

- **Test scripts**: Delete `test-*.js`, `debug-*.js` files immediately after use
- **Temporary files**: Remove `temp-*`, `*.backup`, `*.old` files before committing
- **Debug outputs**: Delete test JSON files, debug logs, temporary data files
- **Old APKs**: Keep only the latest release APK, delete previous versions
- **Deployment scripts**: Remove one-off deployment scripts after successful deployment

#### File Naming Conventions

- **Temporary work**: Use `temp-` prefix (e.g., `temp-feature-test.md`)
- **Test files**: Use `test-` prefix for easy identification
- **Work in progress**: Use `WIP-` or `DRAFT-` prefix
- **Dated files**: Include date for auto-cleanup (e.g., `plan-2025-11-26.md`)

#### Documentation Standards

- **Single source of truth**: Update existing docs instead of creating new ones
- **Use CHANGELOG.md**: Record completed features, fixes, deployments here
- **Delete setup guides**: Remove setup/configuration docs after feature is complete
- **Archive old release notes**: Keep only latest 2-3 versions, delete older ones
- **Consolidate related docs**: One doc per feature, not multiple status files

#### Root Directory Rules

- **Keep root clean**: Only essential files (README, CHANGELOG, LICENSE, config files)
- **No test files in root**: Test files belong in `__tests__` folders or get deleted
- **No temporary docs in root**: Use `/docs` folder or delete after use
- **No build artifacts**: APKs, build outputs should be in `.gitignore`

#### Weekly Maintenance (Every Friday)

1. Review root directory for cleanup candidates
2. Delete any `test-*`, `temp-*`, `debug-*` files
3. Remove old deployment scripts
4. Consolidate or archive old documentation
5. Delete old APK files (keep latest only)

#### Before Every Commit

- Run `git status` and review all files
- Delete any temporary or test files
- Ensure no debug/backup files are staged
- Verify only production-ready files are committed

#### Git Hook Warnings

The pre-commit hook will warn about:

- Files matching `test-*.js` in root directory
- Files with `.backup`, `.old`, `.tmp` extensions
- Files starting with `temp-`, `debug-`, `WIP-`
- Multiple APK files
- Excessive documentation files with similar names

**Remember: A clean repository is a professional repository. Delete as you go.**