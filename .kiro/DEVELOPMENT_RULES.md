# Cook Smart Development Rules
**Last Updated**: November 14, 2025

These are the mandatory rules for all development work on Cook Smart.

---

## 1. Test-Driven Workflow (MANDATORY)

**The Cycle:**
```
BUILD → TEST → FIX → RETEST → CLEANUP → COMMIT
```

- Build code
- Test immediately (run diagnostics, typecheck, lint)
- If errors → Fix using learned solutions first
- Retest until zero errors
- Cleanup all test files
- Scan for any other errors
- Fix any found errors
- Commit with clear message
- Move to next task

**Never move forward until tests pass!**

---

## 2. Zero Tolerance on Errors

- Fix ALL errors immediately - no exceptions
- After each build, scan for ANY type of error
- Fix errors on the spot before proceeding
- TypeScript errors, ESLint warnings, build failures - all must be zero
- No "we'll fix it later" - fix it NOW

**Acceptable error count: 0**

---

## 3. Always Clean Up After Yourself

- Delete ALL test files after successful verification
- Remove temporary scripts after one-time use
- Remove redundant files that duplicate functionality
- Update .gitignore to prevent tracking generated files
- Keep only essential, operational code

**If it's not needed for the program to run, delete it!**

---

## 4. Learn and Apply

- Remember what fixed each error type
- Apply learned solutions first on repeat errors
- Don't repeat failed approaches
- Build a mental knowledge base of working fixes
- Document successful fixes in fixes-log.md

**Don't work in circles - use what works!**

---

## 5. Efficiency First

- Don't work in circles
- Don't retry approaches that already failed
- Use proven solutions from past fixes
- Move forward systematically
- If stuck after 2 attempts, ask for help

**Time is valuable - work smart!**

---

## 6. Cook Smart Specific Rules

### Quality Standards
- ✅ Quality First - scan and verify at every stage
- ✅ Run verification after EVERY code change
- ✅ Test each feature immediately after implementation
- ✅ Zero tolerance for syntax errors, build failures, broken functionality

### Technology Stack
- ✅ React Native (no Expo) for mobile
- ✅ Lambda functions for backend (not Express)
- ✅ PostgreSQL on AWS RDS for database
- ✅ TypeScript everywhere

### BETA Requirements
- ✅ Free BETA - all features free during testing
- ✅ Clear BETA labeling throughout app
- ✅ "Under Development" markers for incomplete features
- ✅ Scalable for 250+ users

---

## 7. AWS Cost Management (CRITICAL)

### Current Setup
- **Lambda**: 1M free requests/month (always free)
- **API Gateway**: 1M free requests/month (12 months free)
- **S3**: 5GB storage free (12 months free)
- **RDS PostgreSQL**: ~$15/month (PAID - db.t3.micro)
- **Emergency Budget**: $20/month for truly necessary services ONLY

### Cost Rules
- ❌ NOT on 12-month free trial
- ✅ We're paying ~$15/month for RDS already
- ✅ Only ~$5/month buffer remaining
- ✅ Every new service must justify its cost
- ✅ Check cost implications for EVERY service before implementing
- ✅ Scale only when user demand/revenue justifies it
- ✅ Monitor usage constantly

**Cost minimization is priority #1!**

---

## 8. Documentation

- Document fixes in fixes-log.md
- Keep CODE_HEALTH_REPORT.md updated
- Clear commit messages explaining what and why
- Update progress tracking after completing tasks

---

## 9. Git Workflow

- Commit after each successful feature/fix
- Clear, descriptive commit messages
- Push to develop branch regularly
- Use `--no-verify` flag when needed (pre-commit hooks)

---

## 10. Testing Requirements

### What to Test
- TypeScript compilation (`npm run typecheck`)
- ESLint (`npx eslint src --max-warnings 0`)
- Diagnostics for critical files
- End-to-end functionality for new features

### When to Test
- After EVERY code change
- Before committing
- Before moving to next task
- After fixing errors

### Test Cleanup
- Delete test files after verification
- Keep only production code
- No test clutter in codebase

---

## Summary: The Golden Rule

**"Build → Test → Fix → Retest → Cleanup → Verify → Commit"**

If it doesn't pass all tests with zero errors, it doesn't get committed.
If it's not needed for production, it gets deleted.
If it costs money, it better be essential.

---

## Quick Checklist Before Moving On

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] Test files deleted
- [ ] No temporary files remaining
- [ ] Cost implications checked (if applicable)
- [ ] Changes committed and pushed
- [ ] Ready for next task

**Only proceed when ALL boxes are checked!**
