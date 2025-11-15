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