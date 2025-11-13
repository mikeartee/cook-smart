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

## Development Rules

### Quality Assurance
1. **MANDATORY**: Run verification scan after every code change
2. **MANDATORY**: Fix all errors before proceeding to next task
3. **MANDATORY**: Test each feature immediately after implementation
4. **MANDATORY**: No moving forward until current feature works and passes verification
5. Document any issues and their solutions in fixes-log.md

### Verification Process
- Run `auto-verify.bat` or `node .kiro/verify-and-scan.js` after every change
- Must show "ALL CHECKS PASSED" before marking task complete
- Auto-fix available for common issues
- Zero tolerance for syntax errors, build failures, or broken functionality

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